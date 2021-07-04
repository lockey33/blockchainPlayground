import ethers from 'ethers'
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'
import { JSBI, WETH as WETHs, ETHER, Fraction, Pair, Price, Percent, Trade, TradeType, Route, ChainId, Currency, CurrencyAmount, Router, Fetcher, TokenAmount, Token  } from './pancakeswap-sdk-v2/dist/index.js'
import Common from 'ethereumjs-common';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Tx = require('ethereumjs-tx').Transaction
const BIPS_BASE = JSBI.BigInt(100)


export default class SwapFactory {

    constructor(config, contractManager, helper, accountManager) {
        this.config = config
        this.contractManager = contractManager
        this.helper = helper
        this.accountManager = accountManager

    }

    async fetchPair(inputTokenInstance, outputTokenInstance){

        let pair = await Fetcher.fetchPairData(inputTokenInstance, outputTokenInstance, this.config.provider)
        console.log(pair)
        const route = new Route([pair], WETHs[inputTokenInstance.chainId])

        let pairData = {
            tokenPriceInBnb: route.midPrice.toSignificant(6), // 1 token = tant de bnb
            bnbPriceForOneToken: route.midPrice.invert().toSignificant(6), // 1 bnb = tant de tokens
            route: route,
            pair: pair
        }

        return pairData
    }

    async getTradeOptions(allowedSlippage, feeOnTransfer = false){
        return {
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            ttl: 60 * 20,
            recipient: await this.helper.checkSum(this.config.recipient),
            feeOnTransfer: feeOnTransfer
        }
    }

    async buyFast(tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, feeOnTransfer, estimateBuy = false){
        const tokenOutContractInstance = await this.contractManager.getFreeContractInstance(tokenOut, ERC20)
        const routerContractInstance =  await this.contractManager.getPaidContractInstance(this.config.router, PANCAKE, this.config.signer)
        const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")

        const tokenInInstance = new Token(this.config.chain, tokenIn, 18)
        const tokenOutInstance = new Token(this.config.chain, tokenOut, tokenOutDecimals)
        const pairData = await this.fetchPair(tokenInInstance, tokenOutInstance)
        const pair = pairData.pair
        const route = new Route([pair], tokenInInstance)

        const typedValueParsed = ethers.utils.parseUnits(value.toString(), 18)
        const trade = new Trade(route, new TokenAmount(tokenInInstance, typedValueParsed), TradeType.EXACT_INPUT)
        const tradeOptions = await this.getTradeOptions(allowedSlippage, feeOnTransfer)

        gasPrice = ethers.utils.parseUnits(gasPrice.toString(), 'gwei')

        const swap = Router.swapCallParameters(trade, tradeOptions, true, false)
        const transactionOptions = {gasPrice: gasPrice, gasLimit: gasLimit}
        transactionOptions.value = ethers.utils.parseUnits(value.toString(), 'ether')
        console.log(swap)
        //this.approveIfNeeded(tokenOutContractInstance, ethers.utils.parseUnits(this.approveMaxValue), 1000000, gasPrice)
        let confirm = null
        if(estimateBuy) {
            try {
                let estimateGas = await routerContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
                console.log(estimateGas)
                const result = await this.contractManager.callContractMethod(routerContractInstance, swap.methodName, swap.args, transactionOptions)
                confirm = await result.wait()
            } catch (err) {
                console.log("gas estimation error, retry now")
                console.log(err)
                return await this.buyFast(tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, feeOnTransfer, estimateBuy)
            }
        }else{
            const result = await this.contractManager.callContractMethod(routerContractInstance, swap.methodName, swap.args, transactionOptions)
            confirm = await result.wait()
        }

        console.log('acheté')
        return confirm
    }

    async swap(typeOfSwap = null, tokenIn, tokenOut, value, allowedSlippage = 12, gasPrice, gasLimit, feeOnTransfer = false){
        //Contracts
        const tokenInContractInstance =  await this.contractManager.getFreeContractInstance(tokenIn, ERC20)
        const tokenOutContractInstance = await this.contractManager.getFreeContractInstance(tokenOut, ERC20)
        const routerContractInstance =  await this.contractManager.getPaidContractInstance(this.config.router, PANCAKE, this.config.signer)

        //Tokens
        const tokenInDecimals = await this.contractManager.callContractMethod(tokenInContractInstance, "decimals")
        const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")
        const tokenInInstance = new Token(this.config.chain, tokenIn, tokenInDecimals)
        const tokenOutInstance = new Token(this.config.chain, tokenOut, tokenOutDecimals)
        let pairData = await this.fetchPair(tokenInInstance, tokenOutInstance)
        //Pair and route
        const pair = pairData.pair
        const route = new Route([pair], tokenInInstance)
        //await this.makeDepositOfWBNB(paidTokenInContractInstance, new CurrencyAmount.ether(JSBI.BigInt(1)))

        const checkTokenInBalance = await this.contractManager.checkTokenBalance(tokenInContractInstance, tokenInInstance, true)
        //const checkTokenOutBalance = await this.checkTokenBalance(tokenOutContractInstance, tokenOutInstance, true)
        console.log('balance tokenIn', checkTokenInBalance)
        //console.log('balance tokenOut', checkTokenOutBalance)

        //manage sell/buy value
        let typedValueParsed = ethers.utils.parseUnits(value.toString(), tokenInDecimals)
        if(typeOfSwap === "sell"){
            console.log('selling')
            typedValueParsed = await this.helper.parseToken(checkTokenInBalance, tokenInInstance, tokenInContractInstance, tokenInDecimals)
            typedValueParsed = typedValueParsed.toSignificant(6)
        }
        let bnbValue = CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
        //Create trade
        const trade = new Trade(route, new TokenAmount(tokenInInstance, typedValueParsed), TradeType.EXACT_INPUT)
        const tradeOptions = await this.getTradeOptions(allowedSlippage, feeOnTransfer)
        gasPrice = ethers.utils.parseUnits(gasPrice.toString(), 'gwei')
        //approval
        if(typeOfSwap !== "buy"){
            await this.contractManager.approveIfNeeded(tokenInContractInstance, ethers.utils.parseUnits(value.toString()), 500000, gasPrice)
        }

        //create hex swap
        let etherIn = (tokenIn === this.config.WBNB ? true : false)
        let etherOut =  (tokenOut === this.config.WBNB ? true : false)

        let swap = Router.swapCallParameters(trade, tradeOptions, etherIn, etherOut)
        let transactionOptions = {gasPrice: gasPrice, gasLimit: gasLimit}
        console.log(transactionOptions)

        if(typeOfSwap !== "sell"){
            transactionOptions.value = ethers.utils.parseUnits(value.toString(), 'ether')
        }
        console.log(swap)
        //verify transaction
        try{
            let estimateGas = await routerContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
            console.log(estimateGas)
        }catch(err){
            console.log("gas estimation error, retry now")
            console.log(err)
            if(feeOnTransfer === false){ // si ça fail c'est peut-être qu'il faut activé le feeOnTransfer ... ou pas
                return await this.swap(typeOfSwap, tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, true)
            }
        }
        let result = await this.contractManager.callContractMethod(routerContractInstance, swap.methodName, swap.args, transactionOptions)
        let confirm = await result.wait()
        console.log(confirm)
        return confirm

    }

    async swapFast(originalTransaction, victimAddress, newGasPrice, newGasLimit){
        console.log('swapFast')
        let inputData = originalTransaction.input
        let parsedRecipientAddress = this.config.recipient.substring(2)
        victimAddress = victimAddress.substring(2)
        victimAddress = victimAddress.toLowerCase()
        let newData = inputData.replace(victimAddress.toLowerCase(), parsedRecipientAddress.toLowerCase())
        console.log(newData)

        const common = Common.default.forCustomChain('mainnet', {
            name: 'bnb',
            networkId: 56,
            chainId: 56
        }, 'petersburg');

        let nonce = await this.config.web3.eth.getTransactionCount(this.config.recipient)
        newGasPrice = parseInt(newGasPrice) * (10 ** 9)
        newGasLimit = parseInt(newGasLimit)

        let newRawTransaction = {from: this.config.recipient,
            gasLimit: this.config.web3.utils.toHex(newGasLimit),
            gasPrice: this.config.web3.utils.toHex(newGasPrice),
            data: newData,
            nonce: this.config.web3.utils.toHex(nonce),
            to: originalTransaction.to,
            value: this.config.web3.utils.toHex(originalTransaction.value),
            //value: 0x16345785d8a0000,
            chainId: 56
        }

        let privKey = new Buffer(this.config.privateKey, 'hex');
        let transaction = new Tx(newRawTransaction, {common})
        transaction.sign(privKey)
        console.log(transaction)

        const serializedTx = transaction.serialize().toString('hex')
        let sendTransaction = await this.config.web3.eth.sendSignedTransaction('0x' + serializedTx)
        console.log(sendTransaction)
        return sendTransaction
    }


}
