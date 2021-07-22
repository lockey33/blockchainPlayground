import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/bsc/accounts.js";
import ethers from "ethers";
import PANCAKE from "./factory/abis/pancake.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve
const nodemailer = require('nodemailer');
const balanceTokenIn = ethers.utils.parseUnits("1", "ether")

const factory =  new GlobalFactory("prod", "cash")
await factory.init()
let params = process.argv.slice(2)
const { exec } = require("child_process");

const tokenToSnipe = await ethers.utils.getAddress(params[0])

console.log("Token a sniper :", tokenToSnipe)

const snipeObject = {
     tokenToSnipe: tokenToSnipe,
     gasLimit : 1000000,
     targetIncrease : 100,
     buyValue : 0.02,
     buySlippage : 1000,
     buyGas : 35,
     estimateBuy : false,

     sellValue : 100,
     sellSlippage : 50,
     sellGas : 15,
     goOut: -20
}


const snipeObjectTest = {
    tokenToSnipe: tokenToSnipe,
    gasLimit : 1000000,
    targetIncrease : 50,
    buyValue : 0.001,
    buySlippage : 1000,
    buyGas : 5,
    estimateBuy : false,

    sellValue : 100,
    sellSlippage : 25,
    sellGas : 20,
    goOut: -20
}

await factory.scheduleFactory.snipeFairLaunch(snipeObject)
