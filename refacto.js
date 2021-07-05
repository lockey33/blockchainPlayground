import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";


const factory =  new GlobalFactory("prod", myAccounts.cash)
const swapFactory = factory.swap

let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
let token2 = ethers.utils.getAddress("0x7cce94c0b2c8ae7661f02544e62178377fe8cf92")
let token2Name = "DaddyDoge"


let gasLimit = 1000000

let buyValue = 0.05// BUY VALUE
let buySlippage = 15 // BUY SLIPPAGE
let buyGas = 5 // BUY GAS

let sellValue = 100 //SELL VALUE
let sellSlippage = 50 // SELL SLIPPAGE
let sellGas = 25

let targetIncrease = 400

const increased = await swapFactory.listenPriceOfCoin("sell", token1, token2, token2Name, targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
await swapFactory.swap("sell",token2, token1, sellValue, sellSlippage, sellGas, gasLimit, true)


