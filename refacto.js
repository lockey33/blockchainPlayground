import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";


const factory =  new GlobalFactory("prod", myAccounts.account1)
const swapFactory = factory.swap

let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
let token2 = ethers.utils.getAddress("0xba07eed3d09055d60caef2bdfca1c05792f2dfad")
let token2Name = "EVERRISE"


let gasLimit = 1000000

let buyValue = 0.05// BUY VALUE
let buySlippage = 15 // BUY SLIPPAGE
let buyGas = 5 // BUY GAS

let sellValue = 100 //SELL VALUE
let sellSlippage = 12 // SELL SLIPPAGE
let sellGas = 5

await factory.swap.swap("buy",token1, token2, buyValue, buySlippage, buyGas, gasLimit, true)


