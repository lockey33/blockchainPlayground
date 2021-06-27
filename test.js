import SwapFactory from "./factory/swapFactory.js";
import config from "./config.js";
import ethers from "ethers";
import ERC20 from "./factory/abis/erc20.js";
import PANCAKE from "./factory/abis/pancake.js";
const swapDragmoon = new SwapFactory("prod", config.dragmoon.mainNetAccount,  config.dragmoon.mainNetKey)
import { JSBI, WETH as WETHs, ETHER, Fraction, Pair, Price, Percent, Trade, TradeType, Route, ChainId, Currency, CurrencyAmount, Router, Fetcher, TokenAmount, Token  } from './factory/pancakeswap-sdk-v2/dist/index.js'
const tokenIn = "0xe9e7cea3dedca5984780bafc599bd69add087d56"
const targetToken = "0x192e9321b6244d204d4301afa507eb29ca84d9ef"
const BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56"
const WBNB = swapDragmoon.WBNB
//const tokenIn = swapDragmoon.WBNB
const BUSDContractInstance =  await swapDragmoon.getFreeContractInstance(WBNB, ERC20)
const WBNBContractInstance = await swapDragmoon.getFreeContractInstance(BUSD, ERC20)
const targetTokenContractInstance = await swapDragmoon.getFreeContractInstance(targetToken, ERC20)
const routerContractInstance =  await swapDragmoon.getPaidContractInstance(swapDragmoon.router, PANCAKE, swapDragmoon.signer)
const totalSupply = await swapDragmoon.callContractMethod(targetTokenContractInstance, "totalSupply")
const targetDecimals = await swapDragmoon.callContractMethod(targetTokenContractInstance, "decimals")
console.log("totalSupply",  totalSupply.toString())
const tokenInInstance = new Token(swapDragmoon.chain, targetToken, targetDecimals)
const tokenOutInstance = new Token(swapDragmoon.chain, BUSD, 18)


let balanceTokenIn = ethers.utils.parseUnits("10", "ether")
console.log(balanceTokenIn)
const options = {balanceTokenIn: balanceTokenIn, tokenIn: BUSD, tokenOut: targetToken}
let marketAmounts =  await swapDragmoon.callContractMethod(routerContractInstance, "getAmountsOut", options)
let marketAmountInBNB = swapDragmoon.readableValue(marketAmounts[0].toString(), 18)
let marketAmountOutBUSD = swapDragmoon.readableValue(marketAmounts[1].toString(), targetToken)
let marketCap = marketAmountOutBUSD * totalSupply.toString()
console.log(marketAmountOutBUSD)
console.log(marketCap)