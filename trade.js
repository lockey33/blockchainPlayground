import ethers from "ethers";
import GlobalFactory from "./factory/globalFactory.js";

//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)

(async () => {
    const factory =  new GlobalFactory("prod", "cash")
    await factory.init()
    let gasLimit = 3000000

    let buyValue = 0.001// BUY VALUE
    let buySlippage = 2 // BUY SLIPPAGE
    let buyGas = 5 // BUY GAS

    let sellValue = 100 //SELL VALUE
    let sellSlippage = 40 // SELL SLIPPAGE
    let sellGas = 25


    let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
    let token2 = ethers.utils.getAddress("0xbC9bB68C561a1Ff1B3fBC954FCEaD1D4862ac5CF")
    //console.log(factory)
    //await factory.swap.swap("buy", token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)
    await factory.swap.swap("sell", token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
})()
