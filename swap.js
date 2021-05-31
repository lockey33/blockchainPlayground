import Web3 from 'web3'
import ethers from 'ethers'
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'
import WBNB from './abis/wbnb.js'
import approveSpender from "./abis/approveSpender.js";
import config from './config.js'
const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'

const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

const testNetBlockIoSocket = 'wss://bsc.getblock.io/testnet/'
const testNetBlockIo = 'https://bsc.getblock.io/testnet/'
const testNetSocket = 'wss://data-seed-prebsc-1-s1.binance.org:8545/'
const testNet = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
const ganacheFork = 'http://127.0.0.1:7545'
const ganacheForkSocket = 'ws://127.0.0.1:8545'

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const txDecoder = require('ethereum-tx-decoder');
const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder('./abis/pancake.json');

import { JSBI, WETH as WETHs, ETHER, Fraction, Pair, Price, Percent, Trade, TradeType, Route, ChainId, Currency, CurrencyAmount, Router, Fetcher, TokenAmount, Token  } from './pancakeswap-sdk-v2/dist/index.js'
import pancake from "./abis/pancake.js";
import {Contract} from "@ethersproject/contracts";
const Tx = require('ethereumjs-tx').Transaction
import Common from 'ethereumjs-common';


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
            this.routerFreeContract = this.getFreeContractInstance(this.router, PANCAKE, this.provider)
            this.routerPaidContract = this.getPaidContractInstance(this.router, PANCAKE, this.provider)
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

    readableValue(value, decimals){
        let customValue = value / Math.pow(10, decimals)
        return customValue.toFixed(4)
    }

    readableBnb(value){
        let customValue = value / Math.pow(10, 18)
        return customValue.toString()
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

    async approveIfNeeded(tokenInContractInstance, paidTokenInContractInstance, value, gasLimit, gasPrice){
        let allowanceTokenIn = await this.getAllowance(tokenInContractInstance)
        console.log('allowance', allowanceTokenIn)
        //const allowanceTokenIn = ethers.BigNumber.from(0)
        try{
            if(allowanceTokenIn.lt(value)){
                console.log('no allowance for token in')
                let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
                let contract = new ethers.Contract(tokenInContractInstance.address, abi, this.signer)
                const tx = await contract.approve(this.router, this.approveMaxValue, {gasLimit: gasLimit, gasPrice: gasPrice})
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

    async getTradeOptions(allowedSlippage, feeOnTransfer = false){
        return {
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), config.BIPS_BASE),
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



    async swap(typeOfSwap = null, tokenIn, tokenOut, value, allowedSlippage = 12, gasPrice, gasLimit){

        //Contracts
        const tokenInContractInstance =  await swapFactory.getFreeContractInstance(tokenIn, ERC20)
        const paidTokenInContractInstance = await swapFactory.getPaidContractInstance(tokenIn, ERC20, this.signer)
        const tokenOutContractInstance = await swapFactory.getFreeContractInstance(tokenOut, ERC20)
        const routerContractInstance =  await swapFactory.getPaidContractInstance(this.router, PANCAKE, this.signer)

        //Tokens
        const tokenInDecimals = await this.callContractMethod(tokenInContractInstance, "decimals")
        const tokenOutDecimals = await this.callContractMethod(tokenOutContractInstance, "decimals")
        const tokenInInstance = new Token(this.chain, tokenIn, tokenInDecimals)
        const tokenOutInstance = new Token(this.chain, tokenOut, tokenOutDecimals)

        let pairData = await this.fetchPair(tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals)
        //Pair and route
        const pair = pairData.pair
        const route = new Route([pair], tokenInInstance)

        //await this.makeDepositOfWBNB(paidTokenInContractInstance, new CurrencyAmount.ether(JSBI.BigInt(1)))

        const checkTokenInBalance = await this.checkTokenBalance(tokenInContractInstance, tokenInInstance, true)
        //const checkTokenOutBalance = await this.checkTokenBalance(tokenOutContractInstance, tokenOutInstance, true)
        console.log('balance tokenIn', checkTokenInBalance)
        //console.log('balance tokenOut', checkTokenOutBalance)



        //manage sell/buy value
        let typedValueParsed = ethers.utils.parseUnits(value.toString(), tokenInDecimals)
        if(typeOfSwap === "sell"){
            console.log('selling')
            typedValueParsed = await this.parseToken(checkTokenInBalance, tokenInInstance, tokenInContractInstance)
            typedValueParsed = typedValueParsed.toSignificant(6)
        }
        let bnbValue = CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
        //Create trade
        let trade = null
        if(tokenIn == this.WBNB){
            let bnbAmount = CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
            console.log(bnbValue)
            trade = new Trade(route, bnbAmount, TradeType.EXACT_INPUT)
        }else{
            trade = new Trade(route, new TokenAmount(tokenInInstance, typedValueParsed), TradeType.EXACT_INPUT)
        }
        const tradeOptions = await this.getTradeOptions(allowedSlippage, true)

        //gas
        gasPrice = ethers.utils.parseUnits(gasPrice.toString(), 'gwei')
        //gasLimit = this.calculateGasMargin(gasPrice)

        //approval
        await this.approveIfNeeded(tokenInContractInstance, paidTokenInContractInstance, ethers.utils.parseUnits(value.toString()), 500000, gasPrice)

        //create hex swap
        let swap = Router.swapCallParameters(trade, tradeOptions)
        let transactionOptions = {gasPrice: gasPrice, gasLimit: gasLimit}
        console.log(swap)
        //verify transaction
        let estimateGas = await routerContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
        console.log(estimateGas)

        //let result = await swapFactory.callContractMethod(routerContractInstance, swap.methodName, swap.args, transactionOptions)
        //let confirm = await result.wait()
        console.log(confirm)

        return confirm
    }



    async pendingTransaction(socket){
        const web3Socket = new Web3(socket);
        let subscription = web3Socket.eth
            .subscribe("pendingTransactions", function(error, result) {})
            .on("data", async(transactionHash)  => {
                const transaction = await web3Socket.eth.getTransaction(transactionHash)
                if (transaction) {
                    try{
                        await this.parseTransactionData(transaction, transactionHash, subscription);
                    }catch(err){

                    }
                }
            })


    }

    async parseTransactionData(transaction, tx, subscription){
        const tokenToFind = ethers.utils.getAddress("0x20d0bb7f85f9dd557b52d533c930c0a5f01b727b")
        const fnDecoder = new txDecoder.FunctionDecoder(PANCAKE);
        const result = fnDecoder.decodeFn(transaction.input);
        const signature = result['signature']
        const signatureHash = result['sighash']
        if(signature.includes("swap")){
            const pathLength = result["path"].length
            const tokenIn = result["path"][0]
            const tokenOut = ethers.utils.getAddress(result["path"][pathLength - 1])
            console.log(tx)
            console.log(tokenOut, tokenToFind)
            if(tokenOut == tokenToFind){ // je ne peux front run que si j'ai le token1
                await this.prepareFrontRun(transaction, tx, signature, result, tokenIn, tokenOut, subscription)
            }
        }
    }

    async swapFast(originalTransaction, victimAddress, newGasPrice, newGasLimit){
        let inputData = originalTransaction.input
        let parsedRecipientAddress = this.recipient.substring(2)
        victimAddress = victimAddress.substring(2)
        victimAddress = victimAddress.toLowerCase()
        let newData = inputData.replace(victimAddress.toLowerCase(), parsedRecipientAddress.toLowerCase())
        const common = Common.default.forCustomChain('mainnet', {
            name: 'bnb',
            networkId: 56,
            chainId: 56
        }, 'petersburg');

        let nonce = await this.web3.eth.getTransactionCount(this.recipient)
        newGasPrice = parseInt(newGasPrice) * (10 ** 9)
        newGasLimit = parseInt(newGasLimit)

        let newRawTransaction = {from: this.recipient,
            gasLimit: this.web3.utils.toHex(newGasLimit),
            gasPrice: this.web3.utils.toHex(newGasPrice),
            data: newData,
            nonce: this.web3.utils.toHex(nonce),
            to: originalTransaction.to,
            value: this.web3.utils.toHex(originalTransaction.value),
            chainId: 56
        }

        let privKey = new Buffer(this.privateKey, 'hex');
        let transaction = new Tx(newRawTransaction, {common})
        transaction.sign(privKey)

        const serializedTx = transaction.serialize().toString('hex')
        let sendTransaction = await this.web3.eth.sendSignedTransaction('0x' + serializedTx)
        console.log(sendTransaction)
        return sendTransaction
    }

    async prepareFrontRun(transaction, tx, signature, result, tokenIn, tokenOut, subscription){
        console.log('preparing front run', transaction)
        console.log('result', result)
        try{
                let amountIn = (transaction.hasOwnProperty("value") ? transaction.value : null)
                if(tokenIn == this.WBNB){
                    amountIn = await this.parseCurrency(amountIn.toString())
                    amountIn = amountIn.toExact()
                    amountIn = this.readableValue(amountIn, 18)
                }else{
                    const tokenInContractInstance =  await swapFactory.getFreeContractInstance(tokenIn, ERC20)
                    const tokenInDecimals = await this.callContractMethod(tokenInContractInstance, "decimals")
                    amountIn = await this.readableValue(amountIn, tokenInDecimals)
                }

                let hexAmountOutMin = ('amountOutMin' in result ? result['amountOutMin'] : result['amountOut'])
                const tokenOutContractInstance = await swapFactory.getFreeContractInstance(tokenOut, ERC20)

                const tokenOutDecimals = await this.callContractMethod(tokenOutContractInstance, "decimals")
                let amountOutMin = hexAmountOutMin.toString()
                let readableOut = this.readableValue(amountOutMin, tokenOutDecimals)

                if(amountIn >= 0.02 && amountIn <= 0.03 ){
                    let cancelSubscribe = await subscription.unsubscribe()
                    console.log("ending search in mempool...")

                    const gasPrice = Math.round(parseInt(this.readableValue(transaction.gasPrice, 9)))
                    const gasLimit = (transaction.gas).toString()
                    const confirmations = transaction.confirmations
                    console.log(confirmations)
                    console.log("[tx " + tx + " gas " + gasPrice + " limit " + gasLimit + " amountIn " + amountIn + " amountOutMin " + amountOutMin + " readableOut " + readableOut + " bnbPriceForOneToken" +" ]")
                    const multiplier = 2
                    //prepare upgraded Trade
                    if((gasPrice * multiplier) <= 30){
                        let frontGas = gasPrice * multiplier
                        let frontLimit = gasLimit * 3
                        frontLimit = Math.trunc(frontLimit)
                        console.log(gasPrice * 2)
                        console.log(gasLimit * 2)

                        let fastSwap = await this.swapFast(transaction, result["to"], frontGas, frontLimit)
                        let tradeTokenToBNB = await this.swap("sell", tokenOut, this.WBNB, 100, 20, 10, frontLimit)
                    }else{
                        console.log('too much gas bruh')
                        process.exit()
                    }

                }
        }catch(err){
            console.log(err)
        }

    }



}



//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)

let swapFactory = new SwapFactory("prod", config.mainNetAccount,  config.mainNetKey) //dragmoon
let swapLanistar = new SwapFactory("prod", config.lanistar.account,  config.lanistar.key) //lanistar
let swapStark = new SwapFactory("prod", config.stark.account,  config.stark.key) //stark

//swapFactory.pendingTransaction(mainNetSocket)

//swapFactory.swapFast()


let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
let token2 = ethers.utils.getAddress("0x89a761d15ddcfe7293d010eaa388d385c135bebc") //dragmoon
let tokenLanistar = ethers.utils.getAddress("0x55d398326f99059ff775485246999027b3197955") //lanistar
let tokenStark = ethers.utils.getAddress("0x55d398326f99059ff775485246999027b3197955") //stark
let buyValue = 0.001
let sellValue = 100
let buySlippage = 12
let sellSlippage = 12
let gasLimit = 700000
let buyGas = 5
let sellGas = 5



//let tradeBNBToToken = await swapFactory.swap("buy",token1, token2, buyValue, buySlippage, 5, 200000)
//let tradeTokenToBNB = await swapFactory.swap("sell", token2, token1, sellValue, sellSlippage, 5, 200000)


const tradeBNBForLanistar = await swapLanistar.swap("buy",token1, tokenLanistar, buyValue, buySlippage, buyGas, gasLimit)
const lanistarForBNB = await swapLanistar.swap("sell",tokenLanistar, token1, 100, sellSlippage, sellGas, gasLimit)
const tradeBNBForStark = await swapStark.swap("buy",token1, tokenStark, buyValue, buySlippage, buyGas, gasLimit)
const starkForBNB = await swapStark.swap("sell",tokenStark, token1, 100, sellSlippage, sellGas, gasLimit)



//token acheté 1 allowed 0xe4ddd2daef89d7483917bcc2fd55f361585fd2d3
//token 2 0xdf6bea2a2f47c7bcfc3cb7765bf9b2fa3214b7e9
//wbnb 0xae13d989dac2f0debff460ac112a837c89baa7cd
