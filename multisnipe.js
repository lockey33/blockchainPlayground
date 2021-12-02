import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const readline = require('readline');


(async () => {

    const cash =  new GlobalFactory("prod", "cash")
    await cash.init()
    const biswap =  new GlobalFactory("prod", "biswap")
    await biswap.init()
    const trading =  new GlobalFactory("prod", "trading")
    await trading.init()
    const dividend =  new GlobalFactory("prod", "dividend")
    await dividend.init()
    const pablo =  new GlobalFactory("prod", "pablo")
    await pablo.init()
    const origin =  new GlobalFactory("prod", "origin")
    await origin.init()
    const money =  new GlobalFactory("prod", "money")
    await money.init()
    const serenity =  new GlobalFactory("prod", "serenity")
    await serenity.init()
    const faith =  new GlobalFactory("prod", "faith")
    await faith.init()
    const accomplish =  new GlobalFactory("prod", "accomplish")
    await accomplish.init()

    let params = process.argv.slice(2)

    const tokenToSnipe = await ethers.utils.getAddress(params[0])

    console.log("Token a sniper :", tokenToSnipe)

    const snipeObject = {
        tokenToSnipe: tokenToSnipe,
        gasLimit : 3000000,

        targetIncrease : 1000,
        buyValue : 0.02,
        buySlippage : 70,
        buyGas : 7,

        estimateBuy : false,

        sellValue : 500,
        sellSlippage : 50,
        sellGas : 10,
        goOut: -20
    }

/*    cash.scheduleFactory.snipeFairLaunch(snipeObject)
    biswap.scheduleFactory.snipeFairLaunch(snipeObject)
    trading.scheduleFactory.snipeFairLaunch(snipeObject)
    dividend.scheduleFactory.snipeFairLaunch(snipeObject)
    pablo.scheduleFactory.snipeFairLaunch(snipeObject)
    origin.scheduleFactory.snipeFairLaunch(snipeObject)
    money.scheduleFactory.snipeFairLaunch(snipeObject)
    serenity.scheduleFactory.snipeFairLaunch(snipeObject)
    faith.scheduleFactory.snipeFairLaunch(snipeObject)
    accomplish.scheduleFactory.snipeFairLaunch(snipeObject)*/

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        }else if(key.name === "s"){
            let gasLimit = 3000000
            let sellValue = 100 //SELL VALUE
            let sellSlippage = 30 // SELL SLIPPAGE
            let sellGas = 7
            let token1 = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
            cash.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            biswap.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            trading.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            dividend.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            pablo.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            origin.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            money.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            serenity.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            faith.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
            accomplish.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, false)
        } else {
            console.log(`You pressed the "${str}" key`);
            console.log();
            console.log(key);
            console.log();
        }
    });
    console.log('Press any key...');
})();

