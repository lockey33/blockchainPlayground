import axios from 'axios';
import tokenSchema from '../mongo.schemas/tokenSchema.js';
import mongoose from "mongoose";
mongoose.connect("mongodb://localhost:27017/frontMoney", {useNewUrlParser: true});
import moment from 'moment'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class dbFactory {

    constructor(){
        this.tokenSchema = tokenSchema
    }

    async getAllTokens(){
        let allTokens = await tokenSchema.find()
        return allTokens
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

export default dbFactory = new dbFactory()