import init from "./init.js";
import GlobalFactory from "./factory/globalFactory.js";
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
const factory =  new GlobalFactory("prod", init.account, init.blockchain);


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




app.post('/dxSnipe', async (req, res) => {

    console.log(req.body)

    //await factory.snipeFactory.snipePresale(req.body.buyerAddress, req.body.presaleAddress, null, req.body.contributeAmount, req.body.gasPrice, req.body.gasLimit)
    res.send("sniped")
})

app.get('/stopListen', async (req,res) => {
    const removeJobs =  await factory.scheduleFactory.agenda.cancel({ });
    const setListening = await factory.dbFactory.snipeSchema.updateMany({state: "pending"}, {$set:{state: "done"}})
    res.send("stopped listening")
})






server.listen(port, () => {

    console.log("dxSnipe launched...")
})