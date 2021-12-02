import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/bsc/accounts.js";


const factory =  new GlobalFactory("prod", "cash")


const buyAmount = "0.1"
const gasPrice = 30
const gasLimit = 1000000



factory.snipeFactory.snipePresale(myAccounts.cash.address, "0x266530142edE07a245068c7814e4E7D83fb345d6", "0xb49638e9fBE27cB3C4d55015B2510721dD3716E9", buyAmount, gasPrice, gasLimit)

