import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const factory =  new GlobalFactory("prod", "cash")
await factory.init()

let tokenToWatch = await ethers.utils.getAddress("0x965f527d9159dce6288a2219db51fc6eef120dd1") // biswap
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

    increase:{
         targetIncrease : 5,
         buyValue : 0.01,
         buySlippage : 15,
         buyGas : 8,
     },
    decrease: {
        targetDecrease: 20,
        sellValue : 100,
        sellSlippage : 15,
        sellGas : 8,
    }

}

await factory.scheduleFactory.getProfitOnToken(watchObject)




