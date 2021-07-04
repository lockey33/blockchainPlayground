//Config

import testnetConfig from "../static/projectMode/testnet/config.js";
import prodConfig from "../static/projectMode/prod/config.js";

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


export default class globalFactory {
    constructor(mode, accountConfig) {

        switch(mode){
            case "prod":
                this.config = prodConfig
                this.config.privateKey = accountConfig.privateKey
                this.config.recipient = accountConfig.address
                this.config.signer = new ethers.Wallet(accountConfig.privateKey, this.config.provider)

                break;
            case "test":
                this.config = testnetConfig
                this.config.privateKey = accountConfig.privateKey
                this.config.recipient = accountConfig.address
                this.config.signer = new ethers.Wallet(accountConfig.privateKey, testnetConfig.provider)

                break;
            case "ganache":
                break;
            case "default":
                break;
        }
        this.helper = new HelperFactory(this.config)
        this.contractManager = new ContractFactory(this.config, this.helper)
        this.contracts = this.initContracts(this.config.router, PANCAKE, this.config.provider)
        this.accountManager = new AccountFactory(this.config, this.contractManager)
        this.swap = new SwapFactory(this.config, this.contractManager, this.helper, this.accountManager)
        this.dbFactory = new dbFactory()
        this.scheduleFactory = new scheduleFactory(this.config, this.dbFactory, this.contractManager, this.listener, this.helper)
        this.listener = new ListenerFactory(this.config, this.helper, this.contractManager, this.accountManager, this.swap, this.dbFactory, this.scheduleFactory)


        //params
        this.config.maxMarketCap = 300000

        //launch
    }

    initContracts(router, PANCAKE, provider){

        const contracts = {
            "routerFreeContract": this.contractManager.getFreeContractInstance(router, PANCAKE, provider),
            "routerPaidContract": this.contractManager.getPaidContractInstance(router, PANCAKE, provider),
        }

        return contracts
    }
}
