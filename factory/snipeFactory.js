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

    async createClientAndPaymentWallet(buyerAddress){

        try{
            buyerAddress = ethers.utils.getAddress(buyerAddress)

            const actualDate = moment().format('YYYY-MM-DD HH:mm:ss')
            const buyerExist = await this.dbFactory.buyerExist(buyerAddress)

            if(!buyerExist){
                const newWallet = await this.accountManager.createWallet()
                let mnemonicWallet = ethers.Wallet.fromMnemonic(newWallet.mnemonic.phrase)
                const paymentWallet = {
                    address: newWallet.address,
                    mnemonic: newWallet.mnemonic,
                    privateKey: mnemonicWallet.privateKey,
                    balance: "Loading balance",
                    status: "Waiting payment"
                }
                const truncAddress = this.helper.truncate(buyerAddress, 15)
                const buyerInfo = {
                    "buyerAddress" : buyerAddress,
                    "truncBuyerAddress" : truncAddress,
                    "premium": false,
                    "paymentWallet": paymentWallet,
                    "insertedAtDate" : actualDate
                }

                const snipeMongoose = new this.dbFactory.snipeSchema(buyerInfo)
                await snipeMongoose.save()
                const buyer = await this.checkWallet(buyerAddress)

                return buyer
            }

        }catch(err){
            return err
        }

    }

    async insertSnipeInfo(buyerAddress, contributeAmount, presaleAddress, tokenAddress){
        buyerAddress = ethers.utils.getAddress(buyerAddress)
        presaleAddress = ethers.utils.getAddress(presaleAddress)
        if(tokenAddress){
            tokenAddress = ethers.utils.getAddress(tokenAddress) // auto claim with this line in the future
        }

        try{
            const actualDate = moment().format('YYYY-MM-DD HH:mm:ss')

            const snipe = {
                "presaleAddress" : presaleAddress,
                "tokenAddress" : tokenAddress,
                "contributeAmount" :contributeAmount,
                "date" : actualDate,
                "state" : "pending"
            }

            await this.dbFactory.snipeSchema.updateOne(
                {"buyerAddress": buyerAddress},
                {
                    $push: {
                        snipes: snipe,
                    }
                })

            return true

        }catch(err){
            console.log(err)
            return err
        }
    }



    async checkWallet(buyerAddress){
        buyerAddress = ethers.utils.getAddress(buyerAddress)

        const walletInBDD = await this.dbFactory.getSnipeFiltered({buyerAddress: buyerAddress})
        if(walletInBDD.length > 0){
            return walletInBDD
        }else{
            console.log("failed to get buyer")
            return false
        }
    }

    async createSnipeWallets(buyerAddress, walletAmount){
        try{
            let buyerAccount = await this.dbFactory.getSnipeFiltered({"buyerAddress": buyerAddress})
            if(buyerAccount[0].snipeWallets.length < 3){
                console.log('create')
                for(let i = 1; i <= walletAmount; i++){
                    const newWallet = await this.accountManager.createWallet()
                    let mnemonicWallet = ethers.Wallet.fromMnemonic(newWallet.mnemonic.phrase)
                    const actualDate = moment().unix()
                    const truncAddress = this.helper.truncate(newWallet.address, 15)

                    const snipeWallet = {
                        address: newWallet.address,
                        truncAddress: truncAddress,
                        mnemonic: newWallet.mnemonic,
                        privateKey: mnemonicWallet.privateKey,
                        state: "available",
                        logs: [{date:actualDate , text: "Wallet created, waiting for snipe"}],
                        showPrivateKey: false,
                        showLogs: false
                    }

                    await this.dbFactory.snipeSchema.updateOne(
                        {"buyerAddress": buyerAddress},
                        {
                            $push: {
                                snipeWallets: snipeWallet,
                            }
                        })
                }
            }
            return true
        }catch(err){
            console.log(err)
            return err
        }
    }

    async planifySnipe(buyerAddress, presaleAddress, tokenAddress = null, contributeAmount, gasPrice, gasLimit, timeZoneStartTime, unixStartTime, snipeWalletAddress){

        await this.dbFactory.snipeSchema.updateOne(
            {snipeWallets: {$elemMatch: {address: snipeWalletAddress}}},
            {
                $set: {
                    'snipeWallets.$.timeZoneStartTime': timeZoneStartTime,
                    'snipeWallets.$.presaleStartTime': unixStartTime,
                    'snipeWallets.$.state': "Snipe pending..."
                }
            })

        await this.scheduleFactory.agenda.start()
        const jobName = "snipePresale_" + snipeWalletAddress
        await this.scheduleFactory.agenda.define(jobName, { lockLifetime: 10000 }, async (job, done) => {
            try{
                const actualDate = moment().format('YYYY-MM-DD HH:mm:ss')
                await this.snipePresale(buyerAddress, presaleAddress, tokenAddress = null, contributeAmount, gasPrice, gasLimit, snipeWalletAddress)
                await this.dbFactory.snipeSchema.updateOne(
                    {snipeWallets: {$elemMatch: {address: snipeWalletAddress}}},
                    {
                        $push:{
                            'snipeWallets.logs': {date: actualDate, text: "Presale sniped, you will be able to claim your tokens with this sniper wallet when the presale is finished"},
                        },
                        $set: {
                            'snipeWallets.$.sniped': true,
                        }
                    })
                done()
            }
            catch(err){
                const errorText = "An error has occured :" + err.toString()
                await this.dbFactory.snipeSchema.updateOne(
                    {snipeWallets: {$elemMatch: {address: snipeWalletAddress}}},
                    {
                        $push:{
                            'snipeWallets.logs': {date: actualDate, text: errorText},
                        },

                    })
                console.log(err)
            }
        })

        await this.scheduleFactory.agenda.schedule(timeZoneStartTime, jobName);

    }

    async snipePresale(buyerAddress, presaleAddress, tokenAddress = null, contributeAmount, gasPrice, gasLimit, snipeWalletAddress){

        const walletInBDD = await this.checkWallet(buyerAddress)

        if(walletInBDD !== false){
            console.log('transfer')
            //const transaction = await this.accountManager.transfer(contributeAmount, walletInBDD[0].buyerAddress, walletInBDD[0].paymentWallet.address)
        }
        const transaction = await this.swap.sendTransaction(contributeAmount, gasPrice, gasLimit, presaleAddress, false, null, snipeWalletAddress)

        console.log('acheté')
        return transaction

    }

}
