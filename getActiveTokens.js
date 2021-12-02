import GlobalFactory from "./factory/globalFactory.js";
import init from "./init.js";

(async () => {
    const factory =  new GlobalFactory("prod", init.account, init.blockchain)
    await factory.init() // permet de charger les contrats et autres
    const options = {
        saveInBdd: true,
        wantedSlippage: 0,
        amountBnbFrom: 0.02,
        amountBnbTo: 10,
        marketCap: 300000
    }
    factory.listener.listenToPendingTransactions(options)
})()
