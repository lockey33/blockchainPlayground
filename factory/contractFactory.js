import ethers from 'ethers'
import ERC20 from "./abis/erc20.js";

export default class ContractFactory {

    constructor(config, helper) {
        this.config = config
        this.helper = helper
    }
    async calculateMarketCap(targetToken, targetTokenContractInstance, targetTokenDecimals, routerContractInstance){
        const WBNB = this.config.WBNB;
        const tokenIn = WBNB;
        const balanceTokenIn = ethers.utils.parseUnits("1", "ether");

        const options = {balanceTokenIn: balanceTokenIn, tokenIn: tokenIn, tokenOut: targetToken} // j'ai interverti ici pour avoir un pourcentage cohérent voir commentaire dans createIntervalForCoin

        const priceOfToken = await this.callContractMethod(routerContractInstance, "getAmountsOut", options)
        let priceOut = await this.helper.readableValue(priceOfToken[1], targetTokenDecimals)

        const BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56";
        const optionsBUSD = {balanceTokenIn: balanceTokenIn, tokenIn: WBNB, tokenOut: BUSD}
        const priceOfTokenInBUSD = await this.callContractMethod(routerContractInstance, "getAmountsOut", optionsBUSD)
        const BUSDContract = await this.getFreeContractInstance(BUSD, ERC20)
        const BUSDDecimals = await this.callContractMethod(BUSDContract, "decimals")
        let priceOutInBUSD = await this.helper.readableValue(priceOfTokenInBUSD[1], BUSDDecimals)
        priceOutInBUSD = Math.trunc(priceOutInBUSD)
        let priceOfOneTargetToken = (priceOutInBUSD/priceOut).toFixed(18)
        console.log(priceOfOneTargetToken)
        let totalSupply = await this.callContractMethod(targetTokenContractInstance, "totalSupply")
        totalSupply = await this.helper.toDecimals(totalSupply, targetTokenDecimals)
        let marketCap = priceOfOneTargetToken.toString() * totalSupply

        return {marketCap:Math.trunc(marketCap), tokenPrice:priceOfOneTargetToken}
    }

    removeExponent(x) {
        if (Math.abs(x) < 1.0) {
            var e = parseInt(x.toString().split('e-')[1]);
            if (e) {
                x *= Math.pow(10,e-1);
                x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
            }
        } else {
            var e = parseInt(x.toString().split('+')[1]);
            if (e > 20) {
                e -= 20;
                x /= Math.pow(10,e);
                x += (new Array(e+1)).join('0');
            }
        }
        return x;
    }


    async checkTokenBalance(tokenContractInstance, tokenInstance, readable){

        const balanceOfToken = await this.callContractMethod(tokenContractInstance, 'balanceOf', this.config.recipient)
        console.log(this.config.recipient)
        console.log('balacne', balanceOfToken)
        if(tokenContractInstance.address === this.config.WBNB){
            if(balanceOfToken.isZero()){
                console.log('Aucun WBNB disponible pour le trade')
                return
                //process.exit()
            }
            if(readable){
                const balance = await this.helper.parseCurrency(balanceOfToken.toString())
                return await this.helper.formatAmount(balance)
            }
            return await this.helper.parseCurrency(balanceOfToken.toString())
        }

        if(readable){
            const balance = await this.helper.parseToken(balanceOfToken.toString(), tokenInstance, tokenContractInstance)
            return await this.helper.formatAmount(balance)
        }
        return await this.helper.parseToken(balanceOfToken.toString(), tokenInstance, tokenContractInstance)
    }

    async checkLiquidity(routerContractInstance, balanceTokenIn, tokenIn, tokenOut) {
        try {
            if(balanceTokenIn == 0){
                balanceTokenIn = ethers.utils.parseUnits("1", "ether")
            }
            const options = {balanceTokenIn: balanceTokenIn, tokenIn: tokenIn, tokenOut: tokenOut} // j'ai interverti ici pour avoir un pourcentage cohérent voir commentaire dans createIntervalForCoin
            return await this.callContractMethod(routerContractInstance, "getAmountsOut", options)
        } catch (err) {
            console.log(err)
            console.log("pas de liquidité")
            return false
        }
    }

    async getAccountBalance(){
        let balance = await this.config.provider.getBalance(this.config.recipient)
        console.log('account balance', balance)
        return balance
    }

    async approveIfNeeded(tokenInContractInstance, value, gasLimit, gasPrice){
        let allowanceTokenIn = await this.getAllowance(tokenInContractInstance)
        console.log('allowance', allowanceTokenIn)
        //const allowanceTokenIn = ethers.BigNumber.from(0)
        try{
            if(allowanceTokenIn.lt(value)){
                console.log('no allowance for token in')
                let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
                let contract = new ethers.Contract(tokenInContractInstance.address, abi, this.config.signer)
                const tx = await contract.approve(this.config.router, this.config.approveMaxValue, {gasLimit: gasLimit, gasPrice: gasPrice})
                let waitApprovedIn = await tx.wait()
                allowanceTokenIn = await this.getAllowance(tokenInContractInstance)
                console.log('allowance', allowanceTokenIn)
            }
            console.log('money allowed for tokens')
        }catch(err){
            console.log('approve error', err)
            return false
        }

        return true
    }

    async getFreeContractInstance(contractAdress, abi, signerOrProvider = this.config.provider){
        const contract = new ethers.Contract(contractAdress, abi, signerOrProvider)
        return contract
    }

    async getPaidContractInstance(contractAdress, abi, signerOrProvider = this.config.provider){
        const contract = new ethers.Contract(contractAdress, abi, signerOrProvider)
        return contract
    }

    async callContractMethod(contractInstance, methodName, options = {}, transactionOptions){
        let resultOfCall = null
        let owner = this.config.recipient
        let spender = this.config.router
        let swapMethod = methodName
        if(methodName.includes('swap')){
            methodName = "router"
        }
        if(options.hasOwnProperty("spender")){
            spender = options.spender
        }
        switch(methodName){
            case "addLiquidityETH":
                break;
            case "getAmountsIn":
            case "getAmountsOut":
                resultOfCall = await contractInstance[methodName](options.balanceTokenIn, [options.tokenIn, options.tokenOut])
                break;
            case "getReserves":
                resultOfCall = await contractInstance[methodName](options.factory, options.tokenIn, options.tokenOut)
                break;
            case "deposit":
                resultOfCall = await contractInstance[methodName](options)
                break;
            case "allowance":
                resultOfCall = await contractInstance[methodName](owner, spender)
                break;
            case "approve":
                resultOfCall = await contractInstance[methodName](spender, options.value)
                break;
            case "balanceOf":
                resultOfCall = await contractInstance[methodName](owner)
                break;
            case "router":
                resultOfCall = await contractInstance[swapMethod](...options, transactionOptions)
                break;
            default:
                resultOfCall = await contractInstance[methodName]()
                break;
        }

        return resultOfCall
    }

    async estimateGasForContract(contractInstance, methodName){
        let estimatedGas = await contractInstance.estimateGas[methodName]
        return estimatedGas
    }

    readableValue(value, decimals){
        let customValue = value / Math.pow(10, decimals)
        return customValue.toFixed(6) // attention j'ai modifier ici, avant c'etait 4
    }

    readableBnb(value){
        let customValue = value / Math.pow(10, 18)
        return customValue.toString()
    }

    calculateGasMargin(value){
        return value.mul(ethers.BigNumber.from(10000).add(ethers.BigNumber.from(1000))).div(ethers.BigNumber.from(10000))
    }

    async getAllowance(contract){
        const allowance = this.callContractMethod(contract, 'allowance')
        return allowance
    }


}
