import SwapFactory from "./factory/swapFactory.js";
import config from "./config.js";
import ethers from "ethers";

//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)



const swapDragmoon = new SwapFactory("prod", config.dragmoon.mainNetAccount,  config.dragmoon.mainNetKey) //dragmoon
//const swapLanistar = new SwapFactory("prod", config.lanistar.account,  config.lanistar.key) //lanistar
//const swapStark = new SwapFactory("prod", config.stark.account,  config.stark.key) //stark

//swapFactory.pendingTransaction(mainNetSocket)

//swapFactory.swapFast()

let targetIncrease = 50
let targetDecrease = -40

let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")

let token2 = ethers.utils.getAddress("0x4c23248088789b7500dd952ac6ec094d4867b666")

let gasLimit = 1000000

let buyValue = 0.05// BUY VALUE
let buySlippage = 50 // BUY SLIPPAGE
let buyGas = 15 // BUY GAS

let sellValue = 100 //SELL VALUE
let sellSlippage = 30 // SELL SLIPPAGE
let sellGas = 10
// SELL GAS

let token2Name = "moonrising"


//await swapDragmoon.swap("buy",token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)
try{
    await swapDragmoon.swap("buy",token1,token2, buyValue, buySlippage, buyGas, gasLimit, true)
}catch(err){
    console.log('erreur')
}
const increased = await swapDragmoon.listenPriceOfCoin("sell", token1, token2, token2Name, targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapDragmoon.swap("sell",token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
//swapStark.swap("sell",token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)


//await swapDragmoon.swap("buy",token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)
//await swapDragmoon.swap("sell",token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)

/*
let token2Stark = ethers.utils.getAddress("0xeb24e3b0f5913424d46a0f2249e545577551eb98") //rich
const decreased = await swapStark.listenPriceOfCoin("buy", token1, token2Stark, token2Name, targetDecrease, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapStark.swap("buy",token1, token2Stark, buyValue, buySlippage, buyGas, gasLimit, false)
const increased = await swapStark.listenPriceOfCoin("sell", token1, token2Stark, token2Name, targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapStark.swap("sell",token2Stark, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
*/


//let token2Lanistar = ethers.utils.getAddress("0x6c8eb40d42c009c8369644e15d938cddd599ac6c") //rich
//let token2DragName ="SafeEminem"
//const decreased = await swapLanistar.listenPriceOfCoin("buy", token1, token2Lanistar,token2DragName, targetDecrease, sellValue, sellSlippage, sellGas, gasLimit, true)
//await swapLanistar.swap("buy",token1, token2Lanistar, buyValue, buySlippage, buyGas, gasLimit, false)
//const increased = await swapLanistar.listenPriceOfCoin("sell",token2Lanistar , token1,token2DragName, targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
//await swapLanistar.swap("sell",token2Lanistar, token1, sellValue, sellSlippage, sellGas, gasLimit, true)




/*
let token2Drag = ethers.utils.getAddress("0x1a4abf805de5f346a1a9814b5dcd29f2141b9bb9") //rich
let token2DragName ="HornyPirate"
//const decreased = await swapDragmoon.listenPriceOfCoin("buy", token1, token2Drag,token2DragName, targetDecrease, sellValue, sellSlippage, sellGas, gasLimit, true)
//await swapDragmoon.swap("buy",token1, token2Drag, buyValue, buySlippage, buyGas, gasLimit, false)

//const increased = await swapDragmoon.listenPriceOfCoin("sell", token1, token2Drag,token2DragName, targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapDragmoon.swap("sell",token2Drag, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
*/

