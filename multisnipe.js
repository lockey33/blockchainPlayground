import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const readline = require('readline');


(async () => {

    const multi =  new GlobalFactory("prod", ["cash","biswap"])
    await multi.init()

    let params = process.argv.slice(2)

    const tokenToSnipe = await ethers.utils.getAddress(params[0])

    console.log("Token a sniper :", tokenToSnipe)

    const snipeObject = {
        tokenToSnipe: tokenToSnipe,
        gasLimit : 3000000,

        targetIncrease : 1000,
        buyValue : 0.001,
        buySlippage : 5,
        buyGas : 7,

        estimateBuy : false,

        sellValue : 500,
        sellSlippage : 50,
        sellGas : 10,
        goOut: -20
    }
    await multi.scheduleFactory.multiSnipeFairLaunch(snipeObject)


    /*
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
            multi.swap.swap("sell", tokenToSnipe, token1, sellValue, sellSlippage, sellGas, gasLimit, true)
        } else {
            console.log(`You pressed the "${str}" key`);
            console.log();
            console.log(key);
            console.log();
        }
    });
    console.log('Press any key...');*/
})();

