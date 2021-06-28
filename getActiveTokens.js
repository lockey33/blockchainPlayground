import ListenerFactory from "./factory/listenerFactory.js";
import tokenSchema from './mongo.schemas/tokenSchema.js';
const listener = new ListenerFactory()

const options = {
    saveInBdd: true,
    wantedSlippage: -30,
    amountBnbFrom: 0.05,
    amountBnbTo: 10

}

listener.listenToPendingTransactions(options)