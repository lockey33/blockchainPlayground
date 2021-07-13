import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";
import PANCAKE from "./factory/abis/pancake.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve
const nodemailer = require('nodemailer');
const balanceTokenIn = ethers.utils.parseUnits("1", "ether")

const factory =  new GlobalFactory("prod", myAccounts.cash)
const swapFactory = factory.swap

const WBNB = factory.config.WBNB
let params = process.argv.slice(2)
const { exec } = require("child_process");

const tokenToSnipe = await ethers.utils.getAddress(params[0])
const fs = require('fs')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'laurent.ju974@gmail.com',
        pass: 'pomme974'
    }
});
const mailOptions = {
    from: 'laurent.ju974@gmail.com',
    to: 'lockeyproduction@gmail.com',
    subject: 'Sniper',
    text: tokenToSnipe
};

console.log("Token a sniper :", tokenToSnipe)
let gasLimit = 1000000
let targetIncrease = 20
let buyValue = 0.02// BUY VALUE
let buySlippage = 1000 // BUY SLIPPAGE
let buyGas = 60 // BUY GAS

let sellValue = 100 //SELL VALUE
let sellSlippage = 25 // SELL SLIPPAGE
let sellGas = 20

let estimateBuy = false

let tryAmount = 0

let fileName = tokenToSnipe + ".txt"

const waitLiquidity = setInterval(async() => {
    tryAmount++
    let liquidity = await factory.contractManager.checkLiquidity( balanceTokenIn, WBNB, tokenToSnipe)
    console.log("Nombre d'itérations :", tryAmount, liquidity)
    if(liquidity !== false){
        clearInterval(waitLiquidity)
        try{
            console.log('achat en cours')
            await factory.swap.buyFast(WBNB, tokenToSnipe, buyValue, buySlippage, buyGas, gasLimit, true, estimateBuy)
            fs.writeFile(fileName, 'achat en cours', function (err) {
                if (err) return console.log(err);
                console.log('error logs');
            });
        }catch(buyErr){
            console.log('erreur achat', buyErr)
            fs.writeFile(fileName, buyErr.toString(), function (err) {
                if (err) return console.log(err);
                console.log('error logs');
            });
            killForeverProcess()
        }
        const increased = await factory.swap.listenPriceOfCoin("sell", WBNB, tokenToSnipe, "Sniping", targetIncrease, sellValue, sellSlippage, sellGas, gasLimit, true)
        await swapFactory.swap("sell",tokenToSnipe, WBNB, sellValue, sellSlippage, sellGas, gasLimit, true)
        killForeverProcess()

    }

},3000)

function killForeverProcess(){
    const cmd = "forever stop " + process.pid
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);

    });
}