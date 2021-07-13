import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/bsc/accounts.js";


const factory =  new GlobalFactory("prod", "cash")


const buyAmount = "0.002"
const gasPrice = 5
const gasLimit = 500000



factory.snipeFactory.snipePresale(myAccounts.cash.address, "0x3aFf5c3929754A5F9617D603222EbD4D0b1D196f", "0xa0cF1a30D845441a4E51c29FE6c2Be1329129C33", buyAmount, gasPrice, gasLimit)

