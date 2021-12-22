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
        gasLimit : 5000000,

        targetIncrease : 500,
        buyValue : 0.3,
        buySlippage : 5000,
        buyGas : 40,

        estimateBuy : false,

        sellValue : 500,
        sellSlippage : 100,
        sellGas : 25,
        goOut: -20
    }


    await factory.scheduleFactory.snipeFairLaunch(snipeObject)
})();

