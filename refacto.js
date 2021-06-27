import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";


const factory =  new GlobalFactory("prod", myAccounts.account1)

console.log(factory)