const express = require('express')
const app = express()
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/coinhunt", {useNewUrlParser: true});


app.get('/listenCoins', (req,res) => {

    res.send("Liste des parkings")
})



app.listen(8080, () => {
    console.log("Serveur à l'écoute")
})