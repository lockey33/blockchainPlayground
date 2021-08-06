import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const factory =  new GlobalFactory("prod", "cash")
await factory.init()

let tokenToWatch = await ethers.utils.getAddress("0x54626300818e5c5b44db0fcf45ba4943ca89a9e2") // checoin
let params = process.argv.slice(2)
const { exec } = require("child_process");
if(params[0]){
    tokenToWatch = await ethers.utils.getAddress(params[0])
}
console.log("Worker on token :", tokenToWatch)

const watchObject = {

    tokenToWatch: tokenToWatch,
    gasLimit : 1000000,
    estimateBuy : false,
    reversed: false, // false BNB -> TOKEN || true TOKEN -> BNB

    buy:{
         target : -15,
         buyValue : 0.3,
         buySlippage : 25,
         buyGas : 5
     },
    sell: {
        target: 20,
        sellValue : 100,
        sellSlippage : 8,
        sellGas : 6,
    }

}

await factory.scheduleFactory.getProfitOnToken(watchObject)




