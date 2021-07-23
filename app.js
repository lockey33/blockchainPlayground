import init from "./init.js";
import GlobalFactory from "./factory/globalFactory.js";
import ethers from 'ethers'
import moment from "moment";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve


const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors');
const port = 8080

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});
const factory =  new GlobalFactory("testnet", init.account, init.blockchain);


(async () => {
    await factory.init() // permet de charger les contrats et autres
/*    await factory.scheduleFactory.agenda.on("start", (job) => {
        //console.log("Job %s starting", job.attrs.name);
    });

    await factory.scheduleFactory.listenJobAuto()
    console.log('Refresh des jobs planifié')

    await factory.scheduleFactory.agenda.on("fail", (err, job) => {
        console.log(`Job failed with error: `, job);
    });*/
})();

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
/*    factory.scheduleFactory.stopAllJobs().then(() => {
        if (options.cleanup) console.log('clean');
        if (exitCode || exitCode === 0) console.log(exitCode);
        if (options.exit) process.exit();
    })*/
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

app.set('port', port);
app.use(cors());
app.use(bodyParser.json({limit: '5mb'}))
app.use(bodyParser.urlencoded());
app.use(bodyParser.raw());


app.post('/setPremium', async (req, res) => {
    let buyerAddress = req.body.buyerAddress
    let paymentAddress = req.body.paymentAddress
    const response = await factory.accountManager.setPremium(paymentAddress, buyerAddress, "0.5")
    await factory.snipeFactory.createSnipeWallets(buyerAddress, 3)
    res.send(response)
})

app.post('/listenPayment', async (req, res) => {
    let wallet = req.body.paymentWallet
    await factory.scheduleFactory.listenPaymentWallet(wallet)
    res.send("Listening payment")
})

app.post('/listenBnb', async (req, res) => {
    let wallets = req.body
    let checkSummedWallets = []
    wallets.map((wallet) => {
        checkSummedWallets.push(ethers.utils.getAddress(wallet.address))
    })

    await factory.scheduleFactory.listenWalletsBalance(checkSummedWallets)

    res.send("Listening wallet balance")
})

app.post('/updateWallet', async (req, res) => {
    const walletData = req.body.bddWallet
    await factory.dbFactory.updateWallet(walletData)
    res.send("Wallet updated")
})

app.post('/checkWallet', async (req, res) => {
    const walletAddress = ethers.utils.getAddress(req.body.walletAddress)
    let bddWallet = await factory.snipeFactory.checkWallet(walletAddress)
    if(bddWallet.premium === true && !bddWallet[0].snipeWallets.length === 0){
        console.log(bddWallet)
        await factory.snipeFactory.createSnipeWallets(walletAddress, 3)
    }
    if(bddWallet === false){
        bddWallet = await factory.snipeFactory.createClientAndPaymentWallet(walletAddress)
    }
    res.send(bddWallet)
})

app.post('/createSnipeWallets', async (req, res) => {
    const walletAddress = ethers.utils.getAddress(req.body.walletAddress)
    const walletAmount = 3

    await factory.snipeFactory.createSnipeWallets(walletAddress, walletAmount)

    res.send("snipeWallets created")
})

app.post('/dxSnipe', async (req, res) => {
    console.log('dxsnipe')
    const formatedAmount = parseFloat(req.body.contributeAmount.replace(',', '.'));
    const formatedGasPrice = parseFloat(req.body.gasPrice.replace(',', '.'));
    let presaleStartTime = req.body.presaleStartTime
    const actualDateUnix = moment().unix()
    let unixStartTime = moment(presaleStartTime).format("X")
    console.log(actualDateUnix)
    console.log(unixStartTime)
    console.log(req.body)
    await factory.snipeFactory.planifySnipe(
        ethers.utils.getAddress(req.body.buyerAddress),
        ethers.utils.getAddress(req.body.presaleAddress),
        null, //todo ether.utils.getAddress
        formatedAmount,
        formatedGasPrice,
        req.body.gasLimit,
        presaleStartTime,
        unixStartTime,
        req.body.snipeWalletAddress
    )

    res.send("snipe launched for " + formatedAmount + " BNB")

})

app.get('/stopListen', async (req,res) => {
    const removeJobs =  await factory.scheduleFactory.agenda.cancel({ });
    const setListening = await factory.dbFactory.snipeSchema.updateMany({state: "pending"}, {$set:{state: "done"}})
    res.send("stopped listening")
})






server.listen(port, () => {

    console.log("dxSnipe launched...", port)
})