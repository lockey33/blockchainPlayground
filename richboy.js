import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/bsc/accounts.js";
import ethers from "ethers";
import PANCAKE from "./factory/abis/pancake.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve
const nodemailer = require('nodemailer');
const balanceTokenIn = ethers.utils.parseUnits("1", "ether")



let params = process.argv.slice(2)
const { exec } = require("child_process");

const tokenToSnipe = await ethers.utils.getAddress(params[0])


console.log("Token a sniper :", tokenToSnipe)
const snipeObject = {
    tokenToSnipe: tokenToSnipe,
    gasLimit : 2000000,
    targetIncrease : 200,
    buyValue : 0.08,
    buySlippage : 2000,
    buyGas : 7,

    estimateBuy : true,

    sellValue : 100,
    sellSlippage : 50,
    sellGas : 10,
    goOut: -20
}


const snipeObjectTest = {
    tokenToSnipe: tokenToSnipe,
    gasLimit : 300000,
    targetIncrease : 1000,
    buyValue : 0.001,
    buySlippage : 1,
    buyGas : 5,
    estimateBuy : true,

    sellValue : 100,
    sellSlippage : 30,
    sellGas : 5,
    goOut: -20
}

let factory =  new GlobalFactory("prod", "cash")
await factory.init()
await factory.scheduleFactory.tradeFairLaunch(snipeObjectTest)

factory =  new GlobalFactory("prod", "biswap")
await factory.init()
await factory.scheduleFactory.tradeFairLaunch(snipeObjectTest)

factory =  new GlobalFactory("prod", "dividend")
await factory.init()
await factory.scheduleFactory.tradeFairLaunch(snipeObjectTest)

factory =  new GlobalFactory("prod", "pablo")
await factory.init()
await factory.scheduleFactory.tradeFairLaunch(snipeObjectTest)


//==============================================================//


/*
let factory =  new GlobalFactory("prod", "cash")
await factory.init()
await factory.scheduleFactory.sellFairLaunch(snipeObjectTest)

factory =  new GlobalFactory("prod", "biswap")
await factory.init()
await factory.scheduleFactory.sellFairLaunch(snipeObjectTest)

factory =  new GlobalFactory("prod", "dividend")
await factory.init()
await factory.scheduleFactory.sellFairLaunch(snipeObjectTest)

factory =  new GlobalFactory("prod", "pablo")
await factory.init()
await factory.scheduleFactory.sellFairLaunch(snipeObjectTest)*/
