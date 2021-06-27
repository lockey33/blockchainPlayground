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

import dbFactory from './factory/dbFactory.js'
import SwapFactory from "./factory/swapFactory.js";
import config from "./config.js";


const swapFactory = new SwapFactory("prod", config.dragmoon.mainNetAccount,  config.dragmoon.mainNetKey)


app.set('port', port);
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded());
app.use(bodyParser.raw());



app.get('/getTokens', async (req,res) => {
    const allTokens = await dbFactory.getAllTokens()
    res.send(allTokens)
})
app.get('/deleteTokens', async (req,res) => {
    const deleteAllTokens = await dbFactory.deleteAllTokens()
    res.send(deleteAllTokens)
})





io.on('connection', (socket) => {
    console.log('a user connected');
    let tokens = []


    socket.on('listenToken', async (data) => {
        console.log('start listen : ', data.tokenOut)
        const tokenIn = swapFactory.WBNB
        const tokenOut = data.tokenOut
        const interval = await swapFactory.listenPrice(tokenIn, tokenOut, socket)
        const tokenObject = {contract: tokenOut, interval: interval}
        tokens.push(tokenObject)
    })

    socket.on('deleteAllIntervals', async (allTokensFromFront) => {
        console.log('STOP', allTokensFromFront)

        tokens.map((token) => {
            Object.entries(allTokensFromFront).map(([contract, tokenFront]) => {
                if(token.contract === tokenFront.contract){
                    console.log('here')
                    clearInterval(token.interval)
                }
            })
        })
    })


});

server.listen(port, () => {
    console.log("Serveur à l'écoute")
})