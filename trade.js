import ethers from "ethers";
import GlobalFactory from "./factory/globalFactory.js";

//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)

(async () => {
    const factory =  new GlobalFactory("prod", "banque")
    await factory.init()
    let gasLimit = 5000000

    let sellValue = 100 //SELL VALUE
    let sellSlippage = 50 // SELL SLIPPAGE
    let sellGas = 90


    let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
    let token2 = ethers.utils.getAddress("0x4f7620a4e134b1d3fca3f419663acf351b225c74")

    await factory.swap.swap("sell", token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
})()
