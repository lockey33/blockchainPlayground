import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";


const factory =  new GlobalFactory("prod", myAccounts.account1)
const swapFactory = factory.swap

let token1 = ethers.utils.getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
let token2 = ethers.utils.getAddress("0xe9e7cea3dedca5984780bafc599bd69add087d56")
let token2Name = "EVERRISE"


let gasLimit = 1000000

let buyValue = 0.001// BUY VALUE
let buySlippage = 12 // BUY SLIPPAGE
let buyGas = 5 // BUY GAS

let sellValue = 100 //SELL VALUE
let sellSlippage = 12 // SELL SLIPPAGE
let sellGas = 5


