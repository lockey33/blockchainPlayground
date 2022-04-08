import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);



(async () => {
    const factory =  new GlobalFactory("prod", "banque")
    await factory.init()
    let params = process.argv.slice(2)

    const tokenToSnipe = await ethers.utils.getAddress(params[0])

    console.log("Token a sniper :", tokenToSnipe)

    const snipeObject = {
        tokenToSnipe: tokenToSnipe,
        gasLimit : 3000000,

        targetIncrease : 1000,
        buyValue : 0.0001,
        buySlippage : 10,
        buyGas : 5,

        estimateBuy : true,

        sellValue : 50,
        sellSlippage : 60,
        sellGas : 50,
        goOut: -20
    }


    let gasValue = snipeObject.buyGas * Math.pow(10, -9)
    let maxBnbForGas = gasValue * snipeObject.gasLimit
    console.log(gasValue)
    console.log('max bnb for gas :', maxBnbForGas)
    await factory.scheduleFactory.snipeFairLaunch(snipeObject)
})();

