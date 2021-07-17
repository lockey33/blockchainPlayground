import tokenSchema from '../mongo.schemas/tokenSchema.js';
import mongoose from "mongoose";
import snipeSchema from "../mongo.schemas/snipeSchema.js";
import moment from "moment";
mongoose.connect("mongodb://localhost:27017/frontMoney", {useNewUrlParser: true});


export default class dbFactory {

    constructor(){
        this.tokenSchema = tokenSchema
        this.snipeSchema = snipeSchema
    }

    async getAllSnipe(){
        let allSnipe = await snipeSchema.find()
        return allSnipe
    }

    async getSnipeFiltered(filter){
        let snipes = await snipeSchema.find(filter)
        return snipes
    }

    async updateWallet(walletData){
        await this.snipeSchema.updateOne({buyerAddress: walletData.buyerAddress}, walletData)
    }

    async buyerExist(buyerAddress) {
        let buyer = await snipeSchema.findOne({"buyerAddress": buyerAddress})
        if (buyer == null) {
            return false
        } else {
            return true // le coin n'existe pas
        }
    }

    async getAllTokens(){
        let allTokens = await tokenSchema.find()
        return allTokens
    }

    async getTokensFiltered(filter){
        let tokens = await tokenSchema.find(filter)
        return tokens
    }

    async tokenExist(coinContract) {
        let token = await tokenSchema.findOne({"contract": coinContract})
        if (token == null) {
            return false
        } else {
            return true // le coin n'existe pas
        }
    }

    async deleteAllTokens(){
        const deleteTokens = await tokenSchema.deleteMany({})
        return deleteTokens
    }
}

