//Config
import prodBscConfig from "../static/projectMode/prod/bsc/config.js";
import prodKccConfig from "../static/projectMode/prod/kcc/config.js";
import prodBscAccount from "../static/projectMode/prod/bsc/accounts.js";
import prodKccAccount from "../static/projectMode/prod/kcc/accounts.js";
//Factories
import SwapFactory from "./swapFactory.js";
import ContractFactory from "./contractFactory.js";
import ethers from "ethers";
import PANCAKE from "./abis/pancake.js";
import HelperFactory from "./helperFactory.js";
import AccountFactory from "./accountFactory.js";
import dbFactory from "./dbFactory.js";
import ListenerFactory from "./listenerFactory.js";
import scheduleFactory from "./scheduleFactory.js";
import snipeFactory from "./snipeFactory.js";

export default class globalFactory {
    constructor(mode, accountName, blockchain = "bsc") {
        switch(mode){
            case "prod":
                let prodConfig = prodBscConfig
                let accountConfig = prodBscAccount[accountName]

                if(blockchain === "kcc"){
                    prodConfig = prodKccConfig
                    accountConfig = prodKccAccount[accountName]
                }
                console.log(accountConfig)
                this.config = prodConfig
                this.config.privateKey = accountConfig.privateKey
                this.config.recipient = accountConfig.address
                this.config.signer = new ethers.Wallet(accountConfig.privateKey, this.config.provider)
                break;
            case "default":
                break;
        }
        this.helper = new HelperFactory(this.config)
        this.dbFactory = new dbFactory()
        this.contractManager = new ContractFactory(this.config, this.helper)
        this.accountManager = new AccountFactory(this.config, this.contractManager, this.helper, this.dbFactory)
        this.swap = new SwapFactory(this.config, this.contractManager, this.helper, this.accountManager, this.dbFactory)
        this.scheduleFactory = new scheduleFactory(this.config, this.dbFactory, this.contractManager, this.listener, this.helper, this.accountManager)
        this.listener = new ListenerFactory(this.config, this.helper, this.contractManager, this.accountManager, this.swap, this.dbFactory, this.scheduleFactory)
        this.snipeFactory = new snipeFactory(this.config, this.helper, this.contractManager, this.accountManager, this.swap, this.dbFactory, this.scheduleFactory, this.listener)

        //params
        this.config.maxMarketCap = 300000

        //launch
    }

    async init(){
        await this.contractManager.initContracts(this.config, PANCAKE)
    }


}
