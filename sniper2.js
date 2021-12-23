import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/bsc/accounts.js";
import ethers from "ethers";
import PANCAKE from "./factory/abis/pancake.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);



(async () => {
    const resolve = require('path').resolve
    const nodemailer = require('nodemailer');
    const balanceTokenIn = ethers.utils.parseUnits("1", "ether")
    const factory =  new GlobalFactory("prod", "biswap")
    await factory.init()
    let params = process.argv.slice(2)
    const { exec } = require("child_process");

    const tokenToSnipe = await ethers.utils.getAddress(params[0])

    console.log("Token a sniper :", tokenToSnipe)

    const snipeObject = {
        tokenToSnipe: tokenToSnipe,
        gasLimit : 5000000,

        targetIncrease : 500,
        buyValue : 0.05,
        buySlippage : 80,
        buyGas : 20,

        estimateBuy : false,

        sellValue : 500,
        sellSlippage : 50,
        sellGas : 10,
        goOut: -20
    }


    const snipeObjectTest = {
        tokenToSnipe: tokenToSnipe,
        gasLimit : 5000000,
        targetIncrease : 1000,
        buyValue : 0.001,
        buySlippage : 1000,
        buyGas : 5,
        estimateBuy : false,

        sellValue : 100,
        sellSlippage : 30,
        sellGas : 5,
        goOut: -20
    }

    await factory.scheduleFactory.snipeFairLaunch(snipeObject)

})();
