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
    const origin =  new GlobalFactory("prod", "origin")
    await origin.init()
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
        buyGas : 15,

        estimateBuy : false,

        sellValue : 500,
        sellSlippage : 50,
        sellGas : 10,
        goOut: -20
    }

    cash.scheduleFactory.snipeFairLaunch(snipeObject)
    biswap.scheduleFactory.snipeFairLaunch(snipeObject)
    trading.scheduleFactory.snipeFairLaunch(snipeObject)
    origin.scheduleFactory.snipeFairLaunch(snipeObject)
    accomplish.scheduleFactory.snipeFairLaunch(snipeObject)

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

