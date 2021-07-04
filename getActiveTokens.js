import GlobalFactory from "./factory/globalFactory.js";
import myAccounts from "./static/projectMode/prod/accounts.js";
const factory =  new GlobalFactory("prod", myAccounts.account1)

const options = {
    saveInBdd: true,
    wantedSlippage: -35,
    amountBnbFrom: 0.02,
    amountBnbTo: 10

}

factory.listener.listenToPendingTransactions(options)