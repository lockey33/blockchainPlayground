import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";
import Common from "ethereumjs-common";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Tx = require('ethereumjs-tx').Transaction

const factory =  new GlobalFactory("prod", myAccounts.account1)

const presaleAddress = ethers.utils.getAddress("0x3aFf5c3929754A5F9617D603222EbD4D0b1D196f")
const tokenAddress = ethers.utils.getAddress("0xa0cF1a30D845441a4E51c29FE6c2Be1329129C33")
const buyAmount = "0.01"
const gasPrice = 5
const gasLimit = 1000000



factory.swap.sendTransaction(buyAmount, gasPrice, gasLimit, presaleAddress).then(() => {
    console.log('acheté')
})


