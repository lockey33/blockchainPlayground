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

    let sellValue = 10 //SELL VALUE
    let sellSlippage = 2 // SELL SLIPPAGE
    let sellGas = 45


    let token1 = ethers.utils.getAddress("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7")
    let token2 = ethers.utils.getAddress("0xc7198437980c041c805a1edcba50c1ce5db95118")
    //console.log(factory)
    //await factory.swap.swap("buy", token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)
    await factory.swap.swap("sell", token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
/*    const increased = await factory.swap.listenPriceOfCoin("sell", token1, token2, "IGO", 50, sellValue, sellSlippage, sellGas, gasLimit, true)
    let i = 0;
    try{
        await factory.swap.swap("sell", token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
    }catch(err){
        console.log("retry", i)
        i++;
        if(i < 4){
            await factory.swap.swap("sell", token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
        }
    }*/
})()
