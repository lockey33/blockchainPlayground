import moment from 'moment'
import ethers from 'ethers'
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const txDecoder = require('ethereum-tx-decoder');


export default class ListenerFactory {

    constructor(config, helper, contractManager, accountManager, dbFactory, scheduleFactory) {
        this.config = config
        this.helper = helper
        this.accountManager = accountManager
        this.contractManager = contractManager
        this.dbFactory = dbFactory
        this.scheduleFactory = scheduleFactory
        this.tokens = []
    }




    async listenToPendingTransactions(searchOptions){
        console.log('starting listen ...')
        let subscription = this.config.web3ws.eth
            .subscribe("pendingTransactions", function(error, result) {})
            .on("data", async(transactionHash)  => {
                const transaction = await this.config.web3ws.eth.getTransaction(transactionHash)
                if (transaction) {
                    try{
                        await this.parseTransactionData(transaction, transactionHash, subscription, searchOptions);
                    }catch(err){
                    }
                }
            })

    }

    async getInfosFromTx(transaction, tx, signature, result, tokenIn, tokenOut, subscription, searchOptions){
        try{
            const routerContractInstance = await this.contractManager.getPaidContractInstance(this.config.router, PANCAKE, this.config.signer)
            let amountIn = (transaction.hasOwnProperty("value") ? transaction.value : null)
            if(tokenIn == this.config.WBNB){
                amountIn = await this.helper.parseCurrency(amountIn.toString())
                amountIn = amountIn.toExact()
                amountIn = this.helper.readableValue(amountIn, 18)
            }else{
                const tokenInContractInstance =  await this.contractManager.getFreeContractInstance(tokenIn, ERC20)
                const tokenInDecimals = await this.contractManager.callContractMethod(tokenInContractInstance, "decimals")
                amountIn = await this.helper.readableValue(amountIn, tokenInDecimals)
            }

            let hexAmountOutMin = ('amountOutMin' in result ? result['amountOutMin'] : result['amountOut'])
            const tokenOutContractInstance = await this.contractManager.getFreeContractInstance(tokenOut, ERC20)

            const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")
            const tokenOutName = await this.contractManager.callContractMethod(tokenOutContractInstance, "name")
            let amountOutMin = hexAmountOutMin.toString()
            let readableOut = this.helper.readableValue(amountOutMin, tokenOutDecimals)
            if(amountIn >= searchOptions.amountBnbFrom && amountIn <= searchOptions.amountBnbTo ){

                let balanceTokenIn = ethers.utils.parseUnits(amountIn, "ether")
                const options = {balanceTokenIn: balanceTokenIn, tokenIn: tokenIn, tokenOut: tokenOut}
                try{
                    let marketAmounts =  await this.contractManager.callContractMethod(routerContractInstance, "getAmountsOut", options)
                    let marketAmountIn = this.helper.readableValue(marketAmounts[0].toString(), 18)
                    let marketAmountOut = this.helper.readableValue(marketAmounts[1].toString(), tokenOutDecimals) //
                    //console.log('marketAmountIn :',marketAmountIn)
                    //console.log('marketAmountOut :',marketAmountOut)
                    //console.log('one buy with amount: ', amountIn, tx)


                    const gasPrice = Math.round(parseInt(this.helper.readableValue(transaction.gasPrice, 9)))
                    const gasLimit = (transaction.gas).toString()
                    const slippage = this.helper.calculateIncrease(readableOut, marketAmountOut)

                    const responseObject = {
                        tokenContractInstance: tokenOutContractInstance,
                        tokenDecimals: tokenOutDecimals,
                        routerContractInstance: routerContractInstance,
                        slippage: slippage,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        transaction: transaction,
                        result: result,
                        tokenIn: tokenIn,
                        tokenOut: tokenOut,
                        tokenOutName: tokenOutName,
                        subscription: subscription,
                        marketAmountOut: marketAmountOut,
                    }
                    //console.log("[tx " + tx + " gas " + gasPrice + " limit " + gasLimit + " amountIn " + amountIn + " amountOutMin " + amountOutMin + " readableOut " + readableOut + " slippage " + slippage + " % " + tokenOut +"  ]")

                    return responseObject

                }catch(err){

                }
            }
        }catch(err){
            console.log(err)
        }
    }


    async doActions(txData, params, transaction, tokenOut, result, subscription){

        if(params.tokenToFind !== false && tokenOut == params.tokenToFind){
            if(params.frontRun === true){
                //prepare upgraded Trade
                if(params.tokenToFind !== false && tokenOut == params.tokenToFind){
                    await this.frontRunNow(txData, params, transaction, tokenOut, result, subscription)
                }else{
                    await this.frontRunNow(txData, params, transaction, tokenOut, result, subscription)
                }
            }
        }else{
            if(params.saveInBdd === true){
                try{
                    if(txData){
                        let marketCapObject = await this.contractManager.calculateMarketCap(tokenOut,txData.tokenContractInstance, txData.tokenDecimals, txData.routerContractInstance)

                        if(marketCapObject.marketCap <= 300000){
                            console.log("listening to", tokenOut, "marketCap:",marketCapObject.marketCap)
                            await this.saveInBdd(txData, params, transaction, tokenOut, result, subscription, marketCapObject)

                        }
                    }

                }catch(e){
                    console.log(e)
                }

            }
        }



        return true
    }

    async parseTransactionData(transaction, tx, subscription, params){
        const fnDecoder = new txDecoder.FunctionDecoder(PANCAKE);
        const result = fnDecoder.decodeFn(transaction.input);
        const signature = result['signature']
        const signatureHash = result['sighash']
        if(signature.includes("swapExactETHForTokens")){
            const pathLength = result["path"].length
            const tokenIn = result["path"][0]
            const tokenOut = ethers.utils.getAddress(result["path"][pathLength - 1])

            const txData = await this.getInfosFromTx(transaction, tx, signature, result, tokenIn, tokenOut, subscription, params) // ciblage
            await this.doActions(txData, params, transaction, tokenOut, result, subscription)

        }
    }

    async saveInBdd(txData, params, transaction, tokenOut, result, subscription, marketCapObject){
        if(txData.slippage <= params.wantedSlippage && isFinite(txData.slippage)) {
            const actualDate = moment().format('YYYY-MM-DD')
            const token = {contract: tokenOut, price: marketCapObject.tokenPrice, marketCap: marketCapObject.marketCap, name: txData.tokenOutName, insertedAtDate : actualDate}
            console.log(token)
            const tokenMongoose = new this.dbFactory.tokenSchema(token)
            const tokenExist = await this.dbFactory.tokenExist(tokenOut)
            if(!tokenExist){
                await tokenMongoose.save(function (err) {
                    if (err) return console.log(err)
                    console.log("saved!")
                });
            }
        }
    }

    async frontRunNow(txData, params, transaction, tokenOut, result, subscription){
        if(txData.slippage <= params.wantedSlippage && isFinite(txData.slippage) && (txData.gasPrice * params.multiplier) <= 50){
            await subscription.unsubscribe()
            console.log("ending search in mempool...")

            let frontGas = txData.gasPrice * params.multiplier
            let frontLimit = txData.gasLimit * params.multiplier
            frontLimit = Math.trunc(frontLimit)
            console.log('gasPrice', txData.gasPrice * params.multiplier)
            console.log('gasLimit', txData.gasLimit * params.multiplier)
            console.log('stop here')
            console.log('original value', transaction.value)
            if(params.tradeForReal === true){
                try{
                    let fastSwap = await this.swapFactory.swapFast(transaction, result["to"], frontGas, frontLimit)
                }catch(err){
                    console.log(err)
                }
                let tradeTokenToBNB = await this.swapFactory.swap("sell", tokenOut, this.swapFactory.WBNB, 100, 25, frontGas, frontLimit)
            }
        }
    }

    async getTokenIncrease(tokenOut, targetIncrease = 50, maxTokens){
        return await new Promise(async(resolve) => {
            if(Object.keys(this.tokens).length >= maxTokens){ // sécurité car ca va tellement vite qu'il peut y en avoir plus si je met pas une condition
                resolve(true)
            }
            const balanceTokenIn = ethers.utils.parseUnits("1", "ether")
            const routerContractInstance = await this.contractManager.getPaidContractInstance(this.config.router, PANCAKE, this.config.signer)
            const tokenOutContractInstance =  await this.contractManager.getFreeContractInstance(tokenOut, ERC20)
            const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")
            let amounts = null
            try{
                amounts = await this.contractManager.checkLiquidity(routerContractInstance, balanceTokenIn, this.config.WBNB, tokenOut) // pour 1 bnb, combien
                let initialAmountIn = this.helper.readableValue(amounts[0].toString(), 18)
                let initialAmountOut = this.helper.readableValue(amounts[1].toString(), tokenOutDecimals) //
                let tokenObject = {initialAmountIn: initialAmountIn, initialAmountOut:initialAmountOut }

                if(!(tokenOut in this.tokens)){
                    this.tokens[tokenOut] = tokenObject
                }
                const waitProfit = setInterval(async() => {
                    let amounts = await this.checkLiquidity(routerContractInstance, balanceTokenIn, this.config.WBNB, tokenOut)
                    let actualAmountOut = this.helper.readableValue(amounts[1].toString(), tokenOutDecimals)
                    let pourcentageFluctuation = this.helper.calculateIncrease(initialAmountOut, actualAmountOut)
                    //console.log('\x1b[36m%s\x1b[0m', "decreasePourcentage : "+ pourcentageFluctuation + "% " + tokenOut + " " + tokenOut);
                    //console.log(pourcentageFluctuation, targetIncrease)
                    let actualDateAndHour = moment().format("DD/MM/YYYY HH:mm:ss")
                    //console.log(pourcentageFluctuation)
                    if(this.tokens[tokenOut].hasOwnProperty("fluctuation")){
                        this.tokens[tokenOut].fluctuation[actualDateAndHour] = pourcentageFluctuation
                    }else{
                        this.tokens[tokenOut].fluctuation = {}
                        this.tokens[tokenOut].fluctuation[actualDateAndHour] = pourcentageFluctuation
                    }
                    resolve(true)
                }, 60000)
            }catch(err){
                //console.log(err)
            }
        })
    }


    async getAddress(token){
        return ethers.utils.getAddress(token)
    }

}

