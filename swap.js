import Web3 from 'web3'
import ethers from 'ethers'
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'
import WBNB from './abis/wbnb.js'
import approveSpender from "./abis/approveSpender.js";
import config from './config.js'
const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'
const testNetBlockIoSocket = 'wss://bsc.getblock.io/testnet/'
const testNetBlockIo = 'https://bsc.getblock.io/testnet/'
const testNetSocket = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
const testNet = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
const ganacheFork = 'http://127.0.0.1:7545'
const ganacheForkSocket = 'ws://127.0.0.1:8545'

process.env.NODE_ENV = 'production'


import { JSBI, WETH as WETHs, Fraction, Pair, Price, Percent, Trade, TradeType, Route, ChainId, Currency, CurrencyAmount, Router, Fetcher, TokenAmount, Token  } from '@pancakeswap-libs/sdk-v2'

class SwapFactory {

    constructor(mode, account, privateKey) {
        if(mode === "test"){
            this.chain = ChainId.BSCTESTNET
            this.mode = mode
            this.web3ws = new Web3(new Web3.providers.WebsocketProvider(testNetSocket))
            this.web3 = new Web3(new Web3.providers.HttpProvider(testNet))
            this.provider = new ethers.providers.JsonRpcProvider(testNet)
            this.signer = new ethers.Wallet(privateKey, this.provider)
            this.privateKey = privateKey
            this.WBNB = '0xae13d989dac2f0debff460ac112a837c89baa7cd'
            this.factory = '0x6725f303b657a9451d8ba641348b6761a6cc7a17'
            this.router =  '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'
            this.recipient = account
        }else if(mode === "ganache"){
            this.mode = mode
            this.chain = ChainId.MAINNET
            //this.web3ws = new Web3(new Web3.providers.WebsocketProvider(ganacheForkSocket))
            this.web3 = new Web3(new Web3.providers.HttpProvider(ganacheFork))
            this.provider = new ethers.providers.JsonRpcProvider(ganacheFork)
            this.signer = new ethers.Wallet(privateKey, this.provider)
            this.privateKey = privateKey
            this.WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
            this.factory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
            this.router =  '0x10ED43C718714eb63d5aA57B78B54704E256024E'
            this.recipient = account
            this.routerFreeContract = this.getFreeContractInstance(this.router, PANCAKE, this.provider)
            this.routerPaidContract = this.getPaidContractInstance(this.router, PANCAKE, this.provider)
            this.WBNBFreeContract = this.getFreeContractInstance(this.WBNB, ERC20, this.provider)
            this.WBNBPaidContract = this.getPaidContractInstance(this.WBNB, ERC20, this.provider)
        }else{
            this.mode = mode
            this.chain = ChainId.MAINNET
            this.web3ws = new Web3(new Web3.providers.WebsocketProvider(mainNetSocket))
            this.web3 = new Web3(new Web3.providers.HttpProvider(mainNet))
            this.provider = new ethers.providers.JsonRpcProvider(mainNet)
            this.signer = new ethers.Wallet(privateKey, this.provider)
            this.privateKey = privateKey
            this.WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
            this.factory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
            this.router =  '0x10ED43C718714eb63d5aA57B78B54704E256024E'
            this.recipient = account
            this.routerFreeContract = this.getFreeContractInstance(this.router, PANCAKE, this.provider)
            this.routerPaidContract = this.getPaidContractInstance(this.router, PANCAKE, this.provider)
            this.WBNBFreeContract = this.getFreeContractInstance(this.WBNB, ERC20, this.provider)
            this.WBNBPaidContract = this.getPaidContractInstance(this.WBNB, ERC20, this.provider)
        }
        this.wallet = new ethers.Wallet(this.privateKey)
        this.approveMaxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
    }

    async getAccountBalance(){
        let balance = await this.provider.getBalance(this.wallet.address)
        console.log('account balance', balance)
        return balance
    }

    async getFreeContractInstance(contractAdress, abi, signerOrProvider = this.provider){
        const contract = new ethers.Contract(contractAdress, abi, signerOrProvider)
        return contract
    }

    async getPaidContractInstance(contractAdress, abi, signerOrProvider = this.provider){
        const contract = new ethers.Contract(contractAdress, abi, signerOrProvider)
        return contract
    }

    async callContractMethod(contractInstance, methodName, options = {}, transactionOptions){
        let resultOfCall = null
        let owner = this.recipient
        let spender = this.router
        let swapMethod = methodName
        if(methodName.includes('swap')){
            methodName = "router"
        }
        if(options.hasOwnProperty("spender")){
            spender = options.spender
        }
        switch(methodName){
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

    async formatAmount(parsedAmount){
        if(parsedAmount === 0){
            console.log("Le token n'est pas encore dans mon portefeuille")
            return 0
        }
        if(parsedAmount instanceof CurrencyAmount){
            return parsedAmount.toExact()
        }else{
            return parsedAmount.toSignificant(6)
        }
    }

    async getToken(address, decimals){
        if(this.mode === "test"){
            console.log('test')
            return new Token(ChainId.BSCTESTNET, address, decimals)
        }
        return new Token(ChainId.MAINNET, address, decimals)
    }

    async fetchPair(tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals){
        let inputTokenInstance = await this.getToken(tokenIn, tokenInDecimals)
        let outputTokenInstance = await this.getToken(tokenOut, tokenOutDecimals)
        let pair = await Fetcher.fetchPairData(inputTokenInstance, outputTokenInstance, this.provider)
        const route = new Route([pair], WETHs[inputTokenInstance.chainId])

        let pairData = {
            tokenPriceInBnb: route.midPrice.toSignificant(6), // 1 token = tant de bnb
            bnbPriceForOneToken: route.midPrice.invert().toSignificant(6), // 1 bnb = tant de tokens
            route: route,
            pair: pair
        }

        return pairData
    }

    async parseAmount(value, currency, tokenContractInstance){
        const decimals = await swapFactory.callContractMethod(tokenContractInstance, 'decimals')
        const typedValueParsed = ethers.utils.parseUnits(value, decimals).toString()
        if (typedValueParsed !== '0') {
            return currency instanceof Token
                ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
                : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
        }
    }

    async parseCurrency(value){
        const typedValueParsed = ethers.utils.parseUnits(value, 18).toString()
        if (typedValueParsed !== '0') {
            return new CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
        }
    }

    async parseToken(value, tokenInstance, tokenContractInstance){
        const decimals = await swapFactory.callContractMethod(tokenContractInstance, 'decimals')
        const typedValueParsed = ethers.utils.parseUnits(value, decimals).toString()
        if (typedValueParsed !== '0') {
            return new TokenAmount(tokenInstance, JSBI.BigInt(typedValueParsed))
        }
        return 0
    }


    async swap(tokenIn, tokenOut, value, allowedSlippage = 12){

        //Contracts

        const tokenInContractInstance =  await swapFactory.getFreeContractInstance(tokenIn, ERC20),
              paidTokenInContractInstance = await swapFactory.getPaidContractInstance(tokenIn, ERC20, this.signer),
              tokenOutContractInstance = await swapFactory.getFreeContractInstance(tokenOut, ERC20),
              paidTokenOutContractInstance = await swapFactory.getPaidContractInstance(tokenOut, ERC20, this.signer),
              routerContractInstance =  await swapFactory.getPaidContractInstance(this.router, PANCAKE, this.signer)

        //Tokens
        const tokenInDecimals = await this.callContractMethod(tokenInContractInstance, "decimals")
        const tokenOutDecimals = await this.callContractMethod(tokenOutContractInstance, "decimals")
        const tokenInInstance = new Token(this.chain, tokenIn, tokenInDecimals)
        const tokenOutInstance = new Token(this.chain, tokenOut, tokenOutDecimals)

        let pairData = await this.fetchPair(tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals)
        //console.log(pairData)
        //Pair and route
        const pair = pairData.pair
        const route = new Route([pair], tokenInInstance)
        //console.log(route)
/*        //convert value wanted for swap in CurrencyAmount Object

        //Create trade
        const typedValueParsed = ethers.utils.parseUnits(value.toString(), tokenInDecimals)
        const trade = new Trade(route, new TokenAmount(tokenInInstance, typedValueParsed), TradeType.EXACT_INPUT)
        const tradeOptions = await this.getTradeOptions(allowedSlippage, false)

        // Approve both tokens only if needed
        //await this.approveIfNeeded(tokenInContractInstance, tokenOutInstance, paidTokenInContractInstance, paidTokenOutContractInstance, value)


/!*        let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
        let contract = new ethers.Contract(tokenIn, abi, this.signer)
        const tx = await contract.approve(this.router, ethers.utils.parseUnits('1000.0', 18), {gasLimit: 100000, gasPrice: 5e9})
        console.log('Transaction receipt');
        console.log(tx);*!/

        //await this.makeDepositOfWBNB(paidTokenInContractInstance, new CurrencyAmount.ether(JSBI.BigInt(50)))
        const checkTokenInBalance = await this.checkTokenBalance(tokenInContractInstance, tokenInInstance, true)
        const checkTokenOutBalance = await this.checkTokenBalance(tokenOutContractInstance, tokenOutInstance, true)
        console.log('balance tokenIn', checkTokenInBalance)
        console.log('balance tokenOut', checkTokenOutBalance)

        let swap = Router.swapCallParameters(trade, tradeOptions)
        console.log(swap)
        let gasPrice = ethers.utils.parseUnits('5', 'gwei')
        let gasLimit = this.calculateGasMargin(gasPrice)
        let transactionOptions = {gasPrice: gasPrice, gasLimit: 200000}
        //console.log(swap)
        let estimateGas = await routerContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
        console.log(estimateGas)
        let result = await swapFactory.callContractMethod(routerContractInstance, swap.methodName, swap.args, transactionOptions)
        console.log(result)
        return trade*/
    }

    async makeDepositOfWBNB(tokenInContractInstance, inputAmount){
        try{
            const deposit = await swapFactory.callContractMethod(tokenInContractInstance, "deposit", { value: `0x${inputAmount.raw.toString(16)}` })
            const waitDeposit = await deposit.wait()
        }catch(err){
            console.log('deposit failed', err)
            process.exit()
        }

        return true
    }

    async checkTokenBalance(tokenContractInstance, tokenInstance, readable){
        const balanceOfToken = await swapFactory.callContractMethod(tokenContractInstance, 'balanceOf', this.recipient)
        if(tokenContractInstance.address === this.WBNB){
            if(balanceOfToken.isZero()){
                console.log('Aucun WBNB disponible pour le trade')
                process.exit()
            }
            if(readable){
                const balance = await swapFactory.parseCurrency(balanceOfToken.toString())
                return await swapFactory.formatAmount(balance)
            }
            return await swapFactory.parseCurrency(balanceOfToken.toString())
        }

        if(readable){
            const balance = await swapFactory.parseToken(balanceOfToken.toString(), tokenInstance, tokenContractInstance)
            return await swapFactory.formatAmount(balance)
        }
        return await swapFactory.parseToken(balanceOfToken.toString(), tokenInstance, tokenContractInstance)
    }

    async approveIfNeeded(tokenInContractInstance, tokenOutInstance, paidTokenInContractInstance, paidTokenOutContractInstance, value){

        //const allowanceTokenIn = await this.getAllowance(tokenInContractInstance)
        //const allowanceTokenOut = await this.getAllowance(tokenOutContractInstance)
        const allowanceTokenIn = ethers.BigNumber.from(0)
        const allowanceTokenOut = ethers.BigNumber.from(0)
        try{
            if(allowanceTokenIn.lt(value)){
                console.log('no allowance for token in')
                const spenderContract =  await swapFactory.getPaidContractInstance("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", approveSpender, this.signer)

                let approveIn = await this.callContractMethod(spenderContract, 'approve',{spender: this.router, value:this.approveMaxValue})
                let waitApprovedIn = await approveIn.wait()
            }
            if(allowanceTokenOut.lt(value)){
                console.log('no allowance for token out')
                let approveOut = await this.callContractMethod(paidTokenOutContractInstance, 'approve',{spender: this.router, value:this.approveMaxValue})
                let waitApprovedOut = await approveOut.wait()
            }
            console.log('money allowed for tokens')
        }catch(err){
            console.log('approve error', err)
            return false
        }

        return true
    }

    async getTradeOptions(allowedSlippage, feeOnTransfer = false){
        return {
            allowedSlippage: new Percent(JSBI.BigInt(Math.floor(allowedSlippage)), config.BIPS_BASE),
            ttl: 60 * 20,
            recipient: await this.checkSum(this.recipient),
            feeOnTransfer: feeOnTransfer
        }
    }

    calculateGasMargin(value){
        return value.mul(ethers.BigNumber.from(10000).add(ethers.BigNumber.from(1000))).div(ethers.BigNumber.from(10000))
    }

    async getAllowance(contract){
        const allowance = this.callContractMethod(contract, 'allowance')
        return allowance
    }

    async checkSum(address){
        return ethers.utils.getAddress(address)
    }




}



//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let swapFactory = new SwapFactory("prod", config.mainNetAccount,  config.mainNetKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)
///let trade = await swapFactory.swap("0xae13d989dac2f0debff460ac112a837c89baa7cd", "0xe4ddd2daef89d7483917bcc2fd55f361585fd2d3", 1, 12)
