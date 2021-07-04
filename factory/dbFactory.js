import tokenSchema from '../mongo.schemas/tokenSchema.js';
import mongoose from "mongoose";
mongoose.connect("mongodb://localhost:27017/frontMoney", {useNewUrlParser: true});


export default class dbFactory {

    constructor(){
        this.tokenSchema = tokenSchema
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

