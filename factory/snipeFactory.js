import ethers from 'ethers'

import axios from "axios";
import Common from "ethereumjs-common";
import { createRequire } from 'module';
import moment from "moment";
const require = createRequire(import.meta.url);
const Tx = require('ethereumjs-tx').Transaction

export default class SnipeFactory {

    constructor(config, helper, contractManager, accountManager, swap, dbFactory, scheduleFactory, listener) {
        this.config = config
        this.helper = helper
        this.contractManager = contractManager
        this.accountManager = accountManager
        this.swap = swap
        this.dbFactory = dbFactory
        this.scheduleFactory = scheduleFactory
        this.listener = listener
    }


    async checkFunds(){

    }

    async createWalletForClientAndGetFunds(buyerAddress, contributeAmount, presaleAddress, tokenAddress){

        try{
            const actualDate = moment().format('YYYY-MM-DD HH:mm:ss')

            const snipe = {
                "presaleAddress" : presaleAddress,
                "tokenAddress" : tokenAddress,
                "contributeAmount" :contributeAmount,
                "date" : actualDate,
                "state" : "pending"
            }

            const buyerExist = await this.dbFactory.buyerExist(buyerAddress)

            if(!buyerExist){
                const newWallet = await this.accountManager.createWallet()
                let mnemonicWallet = ethers.Wallet.fromMnemonic(newWallet.mnemonic.phrase)
                const storageAddress = {address: newWallet.address, mnemonic: newWallet.mnemonic, privateKey: mnemonicWallet.privateKey}

                const buyerInfo = {
                    "buyerAddress" : buyerAddress,
                    "storage": storageAddress,
                    "insertedAtDate" : actualDate
                }
                buyerInfo.snipes = snipe

                const snipeMongoose = new this.dbFactory.snipeSchema(buyerInfo)
                await snipeMongoose.save()

            }else{
                await this.dbFactory.snipeSchema.updateOne(
                    {"buyerAddress": buyerAddress},
                    {
                        $push: {
                            snipes: snipe,
                        }
                    })
            }

            const buyerInBDD = await this.dbFactory.getSnipeFiltered({buyerAddress: buyerAddress})

            if(buyerInBDD.length > 0){
                const transaction = await this.accountManager.transfer(contributeAmount, buyerInBDD[0].buyerAddress, buyerInBDD[0].storage.address)
                return transaction
            }else{
                console.log("failed")
                return "failed getting snipe"
            }

        }catch(err){
            return err
        }

    }

    async snipePresale(buyerAddress, presaleAddress, tokenAddress = null, contributeAmount, gasPrice, gasLimit){
        buyerAddress = ethers.utils.getAddress(buyerAddress)
        presaleAddress = ethers.utils.getAddress(presaleAddress)
        tokenAddress = ethers.utils.getAddress(tokenAddress) // auto claim with this line in the future

        const transferFundsToStorage = await this.createWalletForClientAndGetFunds(buyerAddress, contributeAmount, presaleAddress, tokenAddress)



        //const transaction = await this.swap.sendTransaction(buyAmount, gasPrice, gasLimit, presaleAddress)

        console.log('acheté')
        //return transaction

    }

}
