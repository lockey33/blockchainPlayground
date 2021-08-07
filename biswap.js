import GlobalFactory from "./factory/globalFactory.js"
import ethers from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const factory =  new GlobalFactory("prod", "biswap")
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
    estimateBuy : true,
    loop: true,

    buy:{
         target : -4,
         buyValue : 0.09,
         buySlippage : 3,
         buyGas : 5
     },
    sell: {
        target: 4,
        sellValue : 100,
        sellSlippage : 3,
        sellGas : 5,
    }

}

await factory.scheduleFactory.getProfitOnToken(watchObject)




