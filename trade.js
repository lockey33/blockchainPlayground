import SwapFactory from "./factory/swapFactory.js";
import config from "./config.js";
import ethers from "ethers";

//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)



const swapDragmoon = new SwapFactory("prod", config.dragmoon.mainNetAccount,  config.dragmoon.mainNetKey) //dragmoon
const swapLanistar = new SwapFactory("prod", config.lanistar.account,  config.lanistar.key) //lanistar
const swapStark = new SwapFactory("prod", config.stark.account,  config.stark.key) //stark
const swap4 = new SwapFactory("prod", config.compte4.account,  config.compte4.key) //stark
//swapFactory.pendingTransaction(mainNetSocket)

//swapFactory.swapFast()

let targetIncrease = 50
let targetDecrease = -40



let gasLimit = 1000000

let buyValue = 0.05// BUY VALUE
let buySlippage = 12 // BUY SLIPPAGE
let buyGas = 5 // BUY GAS

let sellValue = 100 //SELL VALUE
let sellSlippage = 25 // SELL SLIPPAGE
let sellGas = 10
// SELL GAS

let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")

let HUFFLEPUFF = ethers.utils.getAddress("0xb6431fd4cf3a3ae41d7c201affdf4339c472fe74")
let SLYTHERIN = ethers.utils.getAddress("0x3015a7084608579571d9d69750aeb5ef9affd124")
//await swapDragmoon.snipeLaunch("0x33Cc9d0BA5456D82c33A0DAA65533a4a43BdfD73", 0.03, 50, 15, 500000)


/*// ================= Token 1 BUY ===================//
swapDragmoon.buyFast(token1, HUFFLEPUFF, buyValue, buySlippage, buyGas, gasLimit, true)
swapLanistar.buyFast(token1, HUFFLEPUFF, buyValue, buySlippage, buyGas, gasLimit, true)
swapStark.buyFast(token1, SLYTHERIN, buyValue, buySlippage, buyGas, gasLimit, true)
await swap4.buyFast(token1, SLYTHERIN, buyValue, buySlippage, buyGas, gasLimit, true)

// ====================================//

// ================= Token 2 BUY ===================//
swapDragmoon.buyFast(token1, SLYTHERIN, buyValue, buySlippage, buyGas, gasLimit, true)
swapLanistar.buyFast(token1, SLYTHERIN, buyValue, buySlippage, buyGas, gasLimit, true)
swapStark.buyFast(token1, HUFFLEPUFF, buyValue, buySlippage, buyGas, gasLimit, true)
swap4.buyFast(token1, HUFFLEPUFF, buyValue, buySlippage, buyGas, gasLimit, true)

// ====================================//*/


// ================= Sell ===================//
/*
await swapDragmoon.swap("sell",HUFFLEPUFF, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapLanistar.swap("sell",HUFFLEPUFF, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapStark.swap("sell",SLYTHERIN, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
await swap4.swap("sell",SLYTHERIN, token1, sellValue, sellSlippage, sellGas, gasLimit, true)

await swapDragmoon.swap("sell",SLYTHERIN, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapLanistar.swap("sell",SLYTHERIN, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapStark.swap("sell",HUFFLEPUFF, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
await swap4.swap("sell",HUFFLEPUFF, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
*/

// ====================================//





let token2 = ethers.utils.getAddress("0x226664c496ca0165a4bf86d7e274569301af1909")
let token2Name = "Wheels"
let goOut = -43

await swapDragmoon.swap("buy",token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)
const increased = await swapDragmoon.listenPriceOfCoin("sell", token1, token2, token2Name, targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true, goOut)
await swapDragmoon.swap("sell",token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)


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

