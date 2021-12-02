import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);



(async () => {
    const factory =  new GlobalFactory("prod", "cash")
    await factory.init()
    let params = process.argv.slice(2)

    const tokenToSnipe = await ethers.utils.getAddress(params[0])

    console.log("Token a sniper :", tokenToSnipe)

    const snipeObject = {
        tokenToSnipe: tokenToSnipe,
        gasLimit : 4500000,

        targetIncrease : 1000,
        buyValue : 0.02,
        buySlippage : 5000,
        buyGas : 20,

        estimateBuy : false,

        sellValue : 500,
        sellSlippage : 50,
        sellGas : 10,
        goOut: -20
    }


    await factory.scheduleFactory.snipeFairLaunch(snipeObject)
})();

