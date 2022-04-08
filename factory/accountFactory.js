import ethers from 'ethers'
import Common from "ethereumjs-common";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Tx = require('ethereumjs-tx').Transaction

export default class AccountFactory {

    constructor(config, contractManager, helper, dbFactory) {
        this.config = config
        this.contractManager = contractManager
        this.helper = helper
        this.dbFactory = dbFactory
    }

    async createWallet(){
        const wallet =  ethers.Wallet.createRandom();
        return wallet
    }

    async transfer(buyAmount, from, to, gasPrice = 5, gasLimit = 500000 ){
        buyAmount = ethers.utils.parseUnits(buyAmount.toString(), "ether")
        gasPrice = ethers.utils.parseUnits(gasPrice.toString(), "gwei")


        const common = Common.default.forCustomChain('mainnet', {
            name: 'bnb',
            networkId: 56,
            chainId: 56
        }, 'petersburg');

        let nonce = await this.config.web3.eth.getTransactionCount(this.config.recipient)

        const rawTransaction = {
            from: from,
            gasLimit: this.config.web3.utils.toHex(gasLimit),
            gasPrice: this.config.web3.utils.toHex(gasPrice),
            nonce: this.config.web3.utils.toHex(nonce),
            to: to,
            value: this.config.web3.utils.toHex(buyAmount),
            chainId: 56
        }

        try{
            await this.config.web3.eth.estimateGas(rawTransaction)
        }catch(err){
            console.log(err)
            return err
        }



        let privKey = new Buffer(this.config.privateKey, 'hex')
        let transaction = new Tx(rawTransaction, {common})
        transaction.sign(privKey)
        const serializedTx = transaction.serialize().toString('hex')
        let sendTransaction = await this.config.web3.eth.sendSignedTransaction('0x' + serializedTx)

        return sendTransaction

    }


    async getWalletBalance(wallet){
        let balance = await this.config.provider.getBalance(wallet)
        return balance
    }

    async setPremium(paymentAddress, buyerAddress, required) {
        try{
            const balance = await this.getWalletBalance(paymentAddress)
            const readableBalance = await this.helper.readableValue(balance, 18)
            console.log(readableBalance)
            if(parseFloat(readableBalance) >= parseFloat(required)){
                console.log('here', buyerAddress)
                await this.dbFactory.snipeSchema.updateOne({"buyerAddress": buyerAddress}, {$set: {"premium": true}})
                return "Premium ok"
            }
        }catch(err){
            console.log(err)
            return err
        }

    }

    async getAccountBalance(){
        let balance = await this.config.provider.getBalance(this.config.recipient)
        console.log('account balance', balance)
        return balance
    }

    async getAllowance(contract){
        const allowance = this.contractManager.callContractMethod(contract, 'allowance')
        return allowance
    }



}
