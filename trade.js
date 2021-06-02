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


let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")


let buyValue = 0.08
let sellValue = 100
let buySlippage = 4
let sellSlippage = 4
let gasLimit = 800000
let buyGas = 5
let sellGas = 5
let targetIncrease = 50
let targetDecrease = -50

let token2 = ethers.utils.getAddress("0xe9e7cea3dedca5984780bafc599bd69add087d56") //rich


/*
const buyedOnDecrease = await swapDragmoon.listenPriceOfCoin("buy", token1, token2,"MOONBITE BUY", targetDecrease, buyValue, sellSlippage, sellGas, gasLimit, true)
console.log("WAIIIIITT", waitForBuy)
if(buyedOnDecrease === true){
    const soldOnIncrease = await swapDragmoon.listenPriceOfCoin("sell", token1, token2,"MOONBITE SELL", targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
}
*/


/*await swapDragmoon.swap("buy",token1, token2, buyValue, buySlippage, buyGas, gasLimit, true).then(() => {
    swapDragmoon.listenPriceOfCoin("sell", token1, token2,"MOONBITE", targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
})*/
//swapDragmoon.listenPriceOfCoin(token1, token2,"pump")
await swapDragmoon.swap("buy",token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)

//await swapDragmoon.swap("sell",token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)



