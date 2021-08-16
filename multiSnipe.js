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


factory.scheduleFactory.snipeFairLaunch(snipeObjectTest)
