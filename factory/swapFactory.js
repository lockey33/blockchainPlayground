import ethers from 'ethers'
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'
import { JSBI, WETH as WETHs, ETHER, Fraction, Pair, Price, Percent, Trade, TradeType, Route, ChainId, Currency, CurrencyAmount, Router, Fetcher, TokenAmount, Token  } from './pancakeswap-sdk-v2/dist/index.js'
import Common from 'ethereumjs-common';
import { createRequire } from 'module';
import moment from "moment";
const require = createRequire(import.meta.url);
const Tx = require('ethereumjs-tx').Transaction
const BIPS_BASE = JSBI.BigInt(100)
const fs = require('fs')
const path = require('path');
const appDir = path.resolve("./")

export default class SwapFactory {

    constructor(config, contractManager, helper, accountManager, dbFactory) {
        this.config = config
        this.contractManager = contractManager
        this.helper = helper
        this.accountManager = accountManager
        this.dbFactory = dbFactory

    }

    async fetchPair(inputTokenInstance, outputTokenInstance){

        let pair = await Fetcher.fetchPairData(inputTokenInstance, outputTokenInstance, this.config.provider)
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

    convertToBigNumber(value, unit){
        if(ethers.BigNumber.isBigNumber(value)){
            return value
        }

        return ethers.utils.parseUnits(value.toString(), unit)
    }

    async buyFast(tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, feeOnTransfer, estimateBuy = false, tryAmount = 0){

        const tokenOutContractInstance = await this.contractManager.getFreeContractInstance(tokenOut, ERC20)
        const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")

        const tokenInInstance = new Token(this.config.chain, tokenIn, 18)
        const tokenOutInstance = new Token(this.config.chain, tokenOut, tokenOutDecimals)



        let pairData = null
        try{
            pairData = await this.fetchPair(tokenInInstance, tokenOutInstance)
        }catch(err){
            console.log('no liquidity for the moment, try number :', tryAmount)
            tryAmount++
            return this.buyFast(tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, feeOnTransfer, estimateBuy = false, tryAmount)
        }
        const pair = pairData.pair
        const route = new Route([pair], tokenInInstance)
        let trade = null
        const typedValueParsed = ethers.utils.parseUnits(value.toString(), 18)

        try{
            trade = new Trade(route, new TokenAmount(tokenInInstance, typedValueParsed), TradeType.EXACT_INPUT)
        }catch(err){
            console.log(err)
            if(err.isInsufficientReservesError === true){
                    console.log('no liquidity for the moment, try number :', tryAmount)
                    tryAmount++
                    return this.buyFast(tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, feeOnTransfer, estimateBuy = false, tryAmount)
            }else{
                console.log('unknown error, stopping snipe')
                return err
            }
        }
        const tradeOptions = await this.getTradeOptions(allowedSlippage, feeOnTransfer)

        gasPrice = this.convertToBigNumber(gasPrice, 'gwei')

        const swap = Router.swapCallParameters(trade, tradeOptions, true, false)
        const transactionOptions = {gasPrice: gasPrice, gasLimit: gasLimit}
        transactionOptions.value = this.convertToBigNumber(value, 'ether')
        console.log('gas', this.helper.readableValue(gasPrice, '9'))
        console.log(this.helper.readableValue(value, '18'))
        let confirm = null

        if(estimateBuy) {
            try {
                //let estimateGas = await this.contractManager.contracts.routerFreeContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
                let buyAmount = ethers.utils.parseUnits(value.toString(), "ether")
                let contract = new this.config.web3.eth.Contract(PANCAKE, this.config.router)
                let swapData = contract.methods[swap.methodName](...swap.args).encodeABI();

                let rawTransaction = {
                    from : this.config.recipient,
                    to: this.config.router,
                    nonce: this.config.web3.utils.toHex(this.config.web3.eth.getTransactionCount(this.config.recipient)),
                    gasLimit: this.config.web3.utils.toHex(gasLimit),
                    gasPrice: this.config.web3.utils.toHex(gasPrice),
                    value: this.config.web3.utils.toHex(buyAmount),
                    chainId: 56,
                    data: swapData
                }

                let simulateTransaction = await this.config.web3.eth.call(rawTransaction)
                console.log(simulateTransaction)
                const result = await this.contractManager.callContractMethod(this.contractManager.contracts.routerPaidContractInstance, swap.methodName, swap.args, transactionOptions)
                confirm = await result.wait()
            } catch (err) {
                console.log("simulation error, retry now")
                console.log(err)
                tryAmount++
                return await this.buyFast(tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, feeOnTransfer, estimateBuy, tryAmount)
            }
        }else{
            const result = await this.contractManager.callContractMethod(this.contractManager.contracts.routerPaidContractInstance, swap.methodName, swap.args, transactionOptions)
            console.log(result)
            confirm = await result.wait()
        }

        console.log('acheté')
        return confirm
    }

    async swap(typeOfSwap = null, tokenIn, tokenOut, value, allowedSlippage = 12, gasPrice, gasLimit, feeOnTransfer = false){
        //Contracts
        const tokenInContractInstance =  await this.contractManager.getFreeContractInstance(tokenIn, ERC20)
        const tokenOutContractInstance = await this.contractManager.getFreeContractInstance(tokenOut, ERC20)

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
            let estimateGas = await this.contractManager.contracts.routerFreeContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
            console.log(estimateGas)
        }catch(err){
            console.log("gas estimation error, retry now")
            console.log(err)
            if(feeOnTransfer === false){ // si ça fail c'est peut-être qu'il faut activé le feeOnTransfer ... ou pas
                return await this.swap(typeOfSwap, tokenIn, tokenOut, value, allowedSlippage, gasPrice, gasLimit, true)
            }
        }
        let result = await this.contractManager.callContractMethod(this.contractManager.contracts.routerPaidContractInstance, swap.methodName, swap.args, transactionOptions)
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


    async sendTransaction(buyAmount, gasPrice, gasLimit, presaleAddress, rawTransaction = false, count = 1, snipeWalletAddress){

        const actualDate = moment().format("X")
        buyAmount = ethers.utils.parseUnits(buyAmount.toString(), "ether")
        gasPrice = ethers.utils.parseUnits(gasPrice.toString(), "gwei")

        const common = Common.default.forCustomChain('mainnet', {
            name: 'bnb',
            networkId: 56,
            chainId: 56
        }, 'petersburg');

        let nonce = await this.config.web3.eth.getTransactionCount(this.config.recipient)

        if(rawTransaction === false){
            rawTransaction = {
                from: snipeWalletAddress,
                gasLimit: this.config.web3.utils.toHex(gasLimit),
                gasPrice: this.config.web3.utils.toHex(gasPrice),
                nonce: this.config.web3.utils.toHex(nonce),
                to: presaleAddress,
                value: this.config.web3.utils.toHex(buyAmount),
                chainId: 56
            }
        }
        console.log(rawTransaction)

        try{
            let estimatedGas = await this.config.web3.eth.estimateGas(rawTransaction)
        }catch(err){
            console.log(err)
            console.log(count)
            count++
            await this.dbFactory.snipeSchema.updateOne(
                {snipeWallets: {$elemMatch: {address: snipeWalletAddress}}},
                {
                    $push: {
                        'snipeWallets.$.logs': {date:actualDate , text: err.toString()},
                    }
                })
            return await this.sendTransaction(buyAmount, gasPrice, gasLimit, presaleAddress, rawTransaction, count)
        }

        let privKey = new Buffer(this.config.privateKey, 'hex');
        let transaction = new Tx(rawTransaction, {common})
        transaction.sign(privKey)
        const serializedTx = transaction.serialize().toString('hex')

        let sendTransaction = await this.config.web3.eth.sendSignedTransaction('0x' + serializedTx)
        await this.dbFactory.snipeSchema.updateOne(
            {snipeWallets: {$elemMatch: {address: snipeWalletAddress}}},
            {
                $push: {
                    'snipeWallets.$.logs': {date:actualDate , text: "snipe successfull"},
                }
            })
        console.log(sendTransaction)

        return sendTransaction

    }

    async watchTokenPrice(tokenToWatch, params){

        const buyParams = params.buy
        const sellParams = params.sell

        const tokenToWatchContractInstance =  await this.contractManager.getFreeContractInstance(params.tokenToWatch, ERC20)
        const BNBContractInstance =  await this.contractManager.getFreeContractInstance(this.config.WBNB, ERC20)
        const tokenToWatchDecimals = await this.contractManager.callContractMethod(tokenToWatchContractInstance, "decimals")
        const BNBDecimals = await this.contractManager.callContractMethod(BNBContractInstance, "decimals")

        let tokenBalance = null
        let amounts = null
        let initialAmountIn = null
        let initialAmountOut = null

        if(params.reversed === false){ // Bnb -> Token
            tokenBalance = await this.accountManager.getWalletBalance(this.config.recipient)
            amounts = await this.contractManager.checkLiquidity( tokenBalance, this.config.WBNB, params.tokenToWatch)
            initialAmountIn = this.helper.readableValue(amounts[0].toString(), BNBDecimals)
            initialAmountOut = this.helper.readableValue(amounts[1].toString(), tokenToWatchDecimals)
        }else{ // Token -> Bnb
            tokenBalance = await this.contractManager.callContractMethod(tokenToWatchContractInstance, "balanceOf")
            amounts = await this.contractManager.checkLiquidity( tokenBalance, params.tokenToWatch, this.config.WBNB)
            initialAmountIn = this.helper.readableValue(amounts[0].toString(), tokenToWatchDecimals)
            initialAmountOut = this.helper.readableValue(amounts[1].toString(), BNBDecimals)
        }

        console.log(tokenBalance)
        console.log(this.helper.readableValue(tokenBalance.toString(), tokenToWatchDecimals))

        console.log('initialAmountIn :',initialAmountIn)
        console.log('initialAmountOut :',initialAmountOut)
        const logFile = appDir + '/' + tokenToWatch + '.txt'
        let stream = fs.createWriteStream(logFile, {flags:'a'});

        const watchPrice = setInterval(async() => {
            try {
                let amounts = null
                let actualAmountOut = null
                let pourcentageFluctuation = null

                if(params.reversed === false){
                    amounts = await this.contractManager.checkLiquidity(tokenBalance, this.config.WBNB, params.tokenToWatch)
                    actualAmountOut = this.helper.readableValue(amounts[1].toString(), tokenToWatchDecimals)
                    pourcentageFluctuation = this.helper.calculateIncrease(initialAmountOut, actualAmountOut)
                }else{
                    amounts = await this.contractManager.checkLiquidity( tokenBalance, params.tokenToWatch, this.config.WBNB)
                    actualAmountOut = this.helper.readableValue(amounts[1].toString(), BNBDecimals)
                    pourcentageFluctuation = this.helper.calculateIncrease(initialAmountOut, actualAmountOut)
                }


                if(params.reversed === true){
                }
                const actualDate = moment().format('YYYY-MM-DD HH:mm:ss')

                console.log(pourcentageFluctuation, '%', 'initialAmountOut', initialAmountOut, 'BNB', 'actual', actualAmountOut, 'BNB', actualDate)
                const text = pourcentageFluctuation+ "% " + actualDate
                stream.write(text + "\n");
/*
                if(pourcentageFluctuation >= 5){
                    const text = "Le token a augmenté de " + pourcentageFluctuation+ "% " + actualDate
                    console.log(text)
                    stream.write(text + "\n");
                    clearInterval(watchPrice)
                    //await this.swap("sell",params.tokenToWatch, this.config.WBNB, sellParams.sellValue, sellParams.sellSlippage, sellParams.sellGas, params.gasLimit, true)
                    await this.buyFast(this.config.WBNB, params.tokenToWatch, buyParams.buyValue, buyParams.buySlippage, buyParams.buyGas, params.gasLimit, true, buyParams.estimateBuy)
                }
*/

                if(pourcentageFluctuation <= -50){
                    const text = "Le token a diminué de " + pourcentageFluctuation+ "% " + actualDate
                    console.log(text)
                    stream.write(text + "\n");
                    clearInterval(watchPrice)
                    await this.buyFast(this.config.WBNB, params.tokenToWatch, buyParams.buyValue, buyParams.buySlippage, buyParams.buyGas, params.gasLimit, true, buyParams.estimateBuy)
                }

            }catch(err){
                console.log(err)
            }
        }, 1000)
    }

    async listenPriceOfCoin(typeOfListen,tokenIn, tokenOut, tokenOutName, targetIncrease, value, sellSlippage, sellGas, gasLimit, feeOnTransfer, goOut = false){


        //let balanceTokenIn = await contractTokenIn.balanceOf(addresses.recipient)
        //console.log(tokenOut)

        const tokenInContractInstance =  await this.contractManager.getFreeContractInstance(tokenIn, ERC20)
        const tokenOutContractInstance =  await this.contractManager.getFreeContractInstance(tokenOut, ERC20)
        const tokenInDecimals = await this.contractManager.callContractMethod(tokenInContractInstance, "decimals")
        const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")

        let balanceTokenIn = await this.contractManager.callContractMethod(tokenInContractInstance, "balanceOf")
        console.log(this.helper.readableValue(balanceTokenIn.toString(), tokenInDecimals))
        let amounts = await this.contractManager.checkLiquidity( balanceTokenIn, tokenIn, tokenOut) // pour 1 bnb, combien
        let initialAmountIn = this.helper.readableValue(amounts[0].toString(), tokenInDecimals)
        let initialAmountOut = this.helper.readableValue(amounts[1].toString(), tokenOutDecimals) //
        console.log('initialAmountIn :',initialAmountIn)
        console.log('initialAmountOut :',initialAmountOut)


        if(amounts !== false){
            const intervalAchieved = await this.createIntervalForCoin(typeOfListen, targetIncrease, balanceTokenIn,tokenIn, tokenOut, initialAmountIn, initialAmountOut, tokenOutName, tokenOutDecimals, value, sellSlippage, sellGas, gasLimit, feeOnTransfer, goOut)
            console.log("interval fini", intervalAchieved)
            if(intervalAchieved === true){
                return true
            }

        }
    }

    async createIntervalForCoin(typeOfListen, targetIncrease, balanceTokenIn, tokenIn, tokenOut, initialAmountIn, initialAmountOut, tokenOutName, tokenOutDecimals, value, sellSlippage, sellGas, gasLimit, feeOnTransfer, goOut){
        return await new Promise((resolve) => {
            const waitProfit = setInterval(async() => {
                try{
                    let amounts = await this.contractManager.checkLiquidity( balanceTokenIn, tokenIn, tokenOut)
                    let actualAmountOut = this.helper.readableValue(amounts[1].toString(), tokenOutDecimals)
                    let pourcentageFluctuation = this.helper.calculateIncrease(initialAmountOut,actualAmountOut)


                    console.log('----------------')
                    if(typeOfListen === "buy"){
                        console.log('\x1b[36m%s\x1b[0m', "decreasePourcentage : "+ pourcentageFluctuation + "% " + tokenOut + " " + tokenOutName);
                        console.log(pourcentageFluctuation, targetIncrease)
                        if(pourcentageFluctuation <= targetIncrease && isFinite(pourcentageFluctuation)){ // vu que c'est amountsOut, je vérifie combien de tokenOut je peux avoir pour 1 BNB, c'est négatif car du coup moins je peux avoir de tokenOut, plus il a pris de la valeur
                            console.log("La valeur du token " + tokenOut + "a baissé de : " + pourcentageFluctuation +"%,  envoi de l'ordre d'achat en cours" + " cible: " + actualAmountOut + " bnb")
                            clearInterval(waitProfit)
                            console.log('buy token: ',value)
                            //await this.swap("buy",tokenOut, tokenIn, value, sellSlippage, sellGas, gasLimit, feeOnTransfer)
                            console.log("Acheté lors de la baisse")
                            resolve(true)
                        }
                    }else{
                        console.log('\x1b[36m%s\x1b[0m', "increasePourcentage : "+ pourcentageFluctuation + "% " + tokenOut + " " + tokenOutName);
                        if(pourcentageFluctuation >= targetIncrease && isFinite(pourcentageFluctuation)){ // vu que c'est amountsOut, je vérifie combien de tokenOut je peux avoir pour 1 BNB, c'est négatif car du coup moins je peux avoir de tokenOut, plus il a pris de la valeur
                            console.log("La valeur du token " + tokenOut + "a augmenté de : " + pourcentageFluctuation +"%,  envoi de l'ordre d'achat en cours" + " cible: " + actualAmountOut + " bnb")
                            clearInterval(waitProfit)
                            //await this.swap("sell",tokenOut, tokenIn, value, sellSlippage, sellGas, gasLimit, feeOnTransfer)
                            console.log("Vendu avec profit")
                            resolve(true)
                        }
                        if(goOut !== false && pourcentageFluctuation <= goOut){
                            console.log("le token mord la poussière, on se barre")
                            clearInterval(waitProfit)
                            resolve(true)
                        }

                    }
                    console.log('----------------')
                }catch(err){
                    console.log("error within interval")
                    console.log(err)
                    resolve(err)
                }

            }, 1000);
        });

    }


}
