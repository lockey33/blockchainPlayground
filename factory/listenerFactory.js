import Web3 from 'web3'
import ethers from 'ethers'
import config from '../config.js'
const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'

const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
import axios from 'axios';
import tokenSchema from '../mongo.schemas/tokenSchema.js';
import dbFactory from "./dbFactory.js";
import mongoose from "mongoose";
mongoose.connect("mongodb://localhost:27017/frontMoney", {useNewUrlParser: true});
import moment from 'moment'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve
const txDecoder = require('ethereum-tx-decoder');
const ganacheFork = 'http://127.0.0.1:7545'
const ganacheForkSocket = 'ws://127.0.0.1:8545'
const Tx = require('ethereumjs-tx').Transaction
import SwapFactory from "./swapFactory.js";
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'

export default class ListenerFactory {

    constructor() {
        this.swapFactory = new SwapFactory("prod", config.dragmoon.mainNetAccount, config.dragmoon.mainNetKey)
        this.socket = mainNetSocket
        this.tokens = []
    }

    async listenNewPairs(){
        const factory = new ethers.Contract(
            "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
            ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
            this.swapFactory.signer
        );

        let createdTokens = []
        factory.on('PairCreated', async (token0, token1, pairAddress) => {
            console.log(`
                New pair detected
                =================
                token0: ${token0}
                token1: ${token1}
                pairAddress: ${pairAddress}
           `);
            let tokenOut = null
            if(token1 === "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"){
                tokenOut = token0
                createdTokens.push(tokenOut)
            }else{
                tokenOut = token1
                createdTokens.push(tokenOut)
            }
        })

        this.listenChangesinArray(createdTokens, (tokenOut) => {
            const tokenContract = new ethers.Contract(
                tokenOut,
                ['event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'],
                this.swapFactory.signer
            );
            tokenContract.on('OwnershipTransferred', async (previousOwner, newOwner) => {
                console.log('ownership renounced for token', tokenOut)
                console.log('new owner', newOwner)
                console.log('previousOwner', previousOwner)
                this.getTokenIncrease(tokenOut, 50, 10)
                setInterval(() => {console.log(this.tokens)}, 60000)
            })
        })

    }

    listenChangesinArray(arr,callback){
        // Add more methods here if you want to listen to them
        ['pop','push','reverse','shift','unshift','splice','sort'].forEach((m)=>{
            arr[m] = function(){
                var res = Array.prototype[m].apply(arr, arguments);  // call normal behaviour
                callback.apply(arr, arguments);  // finally call the callback supplied
                return res;
            }
        });
    }


    async listenToPendingTransactions(searchOptions){
        console.log('starting front run ...')
        const web3Socket = new Web3(this.socket);
        let subscription = web3Socket.eth
            .subscribe("pendingTransactions", function(error, result) {})
            .on("data", async(transactionHash)  => {
                const transaction = await web3Socket.eth.getTransaction(transactionHash)
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
            const routerContractInstance = await this.swapFactory.getPaidContractInstance(this.swapFactory.router, PANCAKE, this.swapFactory.signer)
            let amountIn = (transaction.hasOwnProperty("value") ? transaction.value : null)
            if(tokenIn == this.WBNB){
                amountIn = await this.swapFactory.parseCurrency(amountIn.toString())
                amountIn = amountIn.toExact()
                amountIn = this.swapFactory.readableValue(amountIn, 18)
            }else{
                const tokenInContractInstance =  await this.swapFactory.getFreeContractInstance(tokenIn, ERC20)
                const tokenInDecimals = await this.swapFactory.callContractMethod(tokenInContractInstance, "decimals")
                amountIn = await this.swapFactory.readableValue(amountIn, tokenInDecimals)
            }

            let hexAmountOutMin = ('amountOutMin' in result ? result['amountOutMin'] : result['amountOut'])
            const tokenOutContractInstance = await this.swapFactory.getFreeContractInstance(tokenOut, ERC20)

            const tokenOutDecimals = await this.swapFactory.callContractMethod(tokenOutContractInstance, "decimals")
            let amountOutMin = hexAmountOutMin.toString()
            let readableOut = this.swapFactory.readableValue(amountOutMin, tokenOutDecimals)
            console.log('one buy with amount: ', amountIn, tx)
            if(amountIn >= searchOptions.amountBnbFrom && amountIn <= searchOptions.amountBnbTo ){

                let balanceTokenIn = ethers.utils.parseUnits(amountIn, "ether")
                const options = {balanceTokenIn: balanceTokenIn, tokenIn: tokenIn, tokenOut: tokenOut}
                try{
                    let marketAmounts =  await this.swapFactory.callContractMethod(routerContractInstance, "getAmountsOut", options)
                    let marketAmountIn = this.swapFactory.readableValue(marketAmounts[0].toString(), 18)
                    let marketAmountOut = this.swapFactory.readableValue(marketAmounts[1].toString(), tokenOutDecimals) //
                    console.log('marketAmountIn :',marketAmountIn)
                    console.log('marketAmountOut :',marketAmountOut)

                    let marketCap = null
                    if(searchOptions.frontRun !== true){
                        marketCap = await this.calculateMarketCap(tokenOut,tokenOutContractInstance, tokenOutDecimals, routerContractInstance)
                        console.log('marketCap', marketCap)

                    }
                    const gasPrice = Math.round(parseInt(this.swapFactory.readableValue(transaction.gasPrice, 9)))
                    const gasLimit = (transaction.gas).toString()
                    const slippage = this.swapFactory.calculateIncrease(readableOut, marketAmountOut)

                    const responseObject = {
                        slippage: slippage,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        transaction: transaction,
                        result: result,
                        tokenIn: tokenIn,
                        tokenOut: tokenOut,
                        subscription: subscription,
                        marketAmountOut: marketAmountOut,
                        marketCap: marketCap
                    }
                    console.log("[tx " + tx + " gas " + gasPrice + " limit " + gasLimit + " amountIn " + amountIn + " amountOutMin " + amountOutMin + " readableOut " + readableOut + " slippage " + slippage + " % " + tokenOut +"  ]")

                    return responseObject

                }catch(err){

                }
            }
        }catch(err){
            console.log(err)
        }
    }
    async calculateMarketCap(token, tokenContractInstance, tokenDecimals, routerContractInstance){
        const totalSupply = await this.swapFactory.callContractMethod(tokenContractInstance, "totalSupply")
        console.log("totalSupply", totalSupply)
        let balanceTokenIn = ethers.utils.parseUnits("1", "ether")
        const options = {balanceTokenIn: balanceTokenIn, tokenIn: "0xe9e7cea3dedca5984780bafc599bd69add087d56", tokenOut: token}
        let marketAmounts =  await this.swapFactory.callContractMethod(routerContractInstance, "getAmountsOut", options)
        let marketAmountIn = this.swapFactory.readableValue(marketAmounts[0].toString(), 18)
        let marketAmountOut = this.swapFactory.readableValue(marketAmounts[1].toString(), tokenDecimals)
        let marketCap = totalSupply * marketAmountOut
        return marketCap
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
                await this.saveInBdd(txData, params, transaction, tokenOut, result, subscription)
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

    async saveInBdd(txData, params, transaction, tokenOut, result, subscription){
        if(txData.slippage <= params.wantedSlippage && isFinite(txData.slippage)) {
            const actualDate = moment().format('YYYY-MM-DD')
            const token = {contract: tokenOut, insertedAtDate : actualDate}
            console.log(token)
            const tokenMongoose = new tokenSchema(token)
            const tokenExist = await dbFactory.tokenExist(tokenOut)
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
            const routerContractInstance = await this.swapFactory.getPaidContractInstance(this.swapFactory.router, PANCAKE, this.swapFactory.signer)
            const tokenOutContractInstance =  await this.swapFactory.getFreeContractInstance(tokenOut, ERC20)
            const tokenOutDecimals = await this.swapFactory.callContractMethod(tokenOutContractInstance, "decimals")
            let amounts = null
            try{
                amounts = await this.checkLiquidity(routerContractInstance, balanceTokenIn, this.swapFactory.WBNB, tokenOut) // pour 1 bnb, combien
                let initialAmountIn = this.swapFactory.readableValue(amounts[0].toString(), 18)
                let initialAmountOut = this.swapFactory.readableValue(amounts[1].toString(), tokenOutDecimals) //
                let tokenObject = {initialAmountIn: initialAmountIn, initialAmountOut:initialAmountOut }

                if(!(tokenOut in this.tokens)){
                    this.tokens[tokenOut] = tokenObject
                }
                const waitProfit = setInterval(async() => {
                    let amounts = await this.checkLiquidity(routerContractInstance, balanceTokenIn, this.swapFactory.WBNB, tokenOut)
                    let actualAmountOut = this.swapFactory.readableValue(amounts[1].toString(), tokenOutDecimals)
                    let pourcentageFluctuation = this.swapFactory.calculateIncrease(initialAmountOut, actualAmountOut)
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

    async checkLiquidity(routerContractInstance, balanceTokenIn, tokenIn, tokenOut) {
        try {
            if(balanceTokenIn == 0){
                balanceTokenIn = ethers.utils.parseUnits("1", "ether")
            }
            const options = {balanceTokenIn: balanceTokenIn, tokenIn: tokenIn, tokenOut: tokenOut} // j'ai interverti ici pour avoir un pourcentage cohérent voir commentaire dans createIntervalForCoin
            return await this.swapFactory.callContractMethod(routerContractInstance, "getAmountsOut", options)
        } catch (err) {
            console.log(err)
            console.log("pas de liquidité", tokenOut)
            return false
        }
    }

    async getAddress(token){
        return ethers.utils.getAddress(token)
    }

}

