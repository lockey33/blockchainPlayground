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



export default class HelperFactory {

    constructor() {
        this.swapFactory = new SwapFactory("prod", config.dragmoon.mainNetAccount, config.dragmoon.mainNetKey)
    }

    async listenPrice(tokenIn, tokenOut){

        const routerContractInstance = await this.swapFactory.getPaidContractInstance(this.swapFactory.router, PANCAKE, this.swapFactory.signer)
        const tokenInContractInstance =  await this.swapFactory.getFreeContractInstance(tokenIn, ERC20)
        const tokenOutContractInstance =  await this.swapFactory.getFreeContractInstance(tokenOut, ERC20)
        const tokenInDecimals = await this.swapFactory.callContractMethod(tokenInContractInstance, "decimals")
        const tokenOutDecimals = await this.swapFactory.callContractMethod(tokenOutContractInstance, "decimals")

        let balanceTokenIn = await this.swapFactory.callContractMethod(tokenInContractInstance, "balanceOf")
        console.log(this.swapFactory.readableValue(balanceTokenIn.toString(), tokenInDecimals))
        let amounts = await this.swapFactory.checkLiquidity(routerContractInstance, balanceTokenIn, tokenIn, tokenOut) // pour 1 bnb, combien
        let initialAmountIn = this.swapFactory.readableValue(amounts[0].toString(), tokenInDecimals)
        let initialAmountOut = this.swapFactory.readableValue(amounts[1].toString(), tokenOutDecimals) //
        console.log('initialAmountIn :',initialAmountIn)
        console.log('initialAmountOut :',initialAmountOut)


        if(amounts !== false){
            const intervalAchieved = await this.priceInterval(balanceTokenIn,tokenIn, tokenOut, initialAmountIn, initialAmountOut,tokenOutDecimals, routerContractInstance)
            console.log("interval fini", intervalAchieved)
            if(intervalAchieved === true){
                return true
            }

        }
    }

    async priceInterval(balanceTokenIn, tokenIn, tokenOut, initialAmountIn, initialAmountOut, tokenOutDecimals, routerContractInstance){
        return await new Promise((resolve) => {
            const waitProfit = setInterval(async() => {
                try{
                    let amounts = await this.swapFactory.checkLiquidity(routerContractInstance, balanceTokenIn, tokenIn, tokenOut)
                    let actualAmountOut = this.swapFactory.readableValue(amounts[1].toString(), tokenOutDecimals)
                    let pourcentageFluctuation = this.calculateIncrease(initialAmountOut,actualAmountOut)


                    console.log('----------------')
                    console.log('\x1b[36m%s\x1b[0m', "increasePourcentage : "+ pourcentageFluctuation + "% " + tokenOut);
                    console.log('----------------')
                }catch(err){
                    console.log("error within interval")
                    console.log(err)
                    resolve(err)
                }

            }, 1000);
        });

    }


    calculateIncrease(originalAmount, newAmount){
        console.log(originalAmount + '-' + newAmount)
        let increase = originalAmount - newAmount   // 100 - 70 = 30
        //console.log(newAmount , originalAmount)
        increase = increase / originalAmount  //  30/ 70
        increase = increase * 100
        increase = Math.round(increase)
        return increase
    }



}
