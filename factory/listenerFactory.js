import Web3 from 'web3'
import ethers from 'ethers'
import ERC20 from '../abis/erc20.js'
import config from '../config.js'
const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'

const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const txDecoder = require('ethereum-tx-decoder');

const Tx = require('ethereumjs-tx').Transaction
import SwapFactory from "./factory/swapFactory.js";


export default class ListenerFactory {

    constructor() {
        this.swapFactory = new SwapFactory("prod", config.dragmoon.mainNetAccount,  config.dragmoon.mainNetKey)
    }

    async listenAllSwapTransactions(socket){
        console.log(this.swapFactory.router)
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
                const tokenInContractInstance =  await this.getFreeContractInstance(tokenIn, ERC20)
                const tokenInDecimals = await this.callContractMethod(tokenInContractInstance, "decimals")
                amountIn = await this.readableValue(amountIn, tokenInDecimals)
            }

            let hexAmountOutMin = ('amountOutMin' in result ? result['amountOutMin'] : result['amountOut'])
            const tokenOutContractInstance = await this.getFreeContractInstance(tokenOut, ERC20)

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

const listener = new ListenerFactory()
listener.listenAllSwapTransactions(mainNetSocket)