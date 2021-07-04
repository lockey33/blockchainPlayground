import { createRequire } from 'module';
import GlobalFactory from "./factory/globalFactory.js";
import myAccounts from "./static/projectMode/prod/accounts.js";
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

const factory =  new GlobalFactory("prod", myAccounts.account1);

(async () => {

    await factory.scheduleFactory.listenJobAuto()
    console.log('Refresh des jobs planifié')

    await factory.scheduleFactory.refreshTokensData()
    console.log("Refresh des tokens planifié")


})();

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    factory.scheduleFactory.stopAllJobs().then(() => {
        if (options.cleanup) console.log('clean');
        if (exitCode || exitCode === 0) console.log(exitCode);
        if (options.exit) process.exit();
    })
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



app.get('/getTokens', async (req,res) => {
    const filters = {marketCap: {$lt: 300000}, listening: true}
    const allTokens = await factory.dbFactory.getTokensFiltered({marketCap: filters.marketCap})
    const setListening = await factory.dbFactory.tokenSchema.updateMany({listening: false}, {$set:{listening: true}})
    console.log('get tokens')
    res.send(allTokens)
})

app.get('/stopListen', async (req,res) => {
    const removeJobs =  await factory.scheduleFactory.agenda.cancel({ });
    const setListening = await factory.dbFactory.tokenSchema.updateMany({listening: true}, {$set:{listening: false}})
    res.send("stopped listening")
})

app.get('/deleteTokens', async (req,res) => {
    const deleteAllTokens = await factory.dbFactory.deleteAllTokens()
    const removeJobs =  await factory.scheduleFactory.agenda.cancel({ });
    res.send("all deleted")
})


app.post('/listenTokens', async (req,res) => {
    const data = req.body
    let tokens = data.tokens

    try{
        await Promise.all(tokens.map(async (token) => {
            const tokenIn = factory.config.WBNB
            const tokenOut = token.contract
            const timer = data.timer
            await factory.listener.listenPrice(tokenIn, tokenOut, timer)
        }))
        await res.send("Listening")

    }catch(err){
        await res.send(err)
    }
})


server.listen(port, () => {


    console.log("Serveur à l'écoute")
})