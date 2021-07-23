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



    async transfer(buyAmount, from, to, gasPrice = 5, gasLimit = 500000){
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
            let gasEstimation = await this.config.web3.eth.estimateGas(rawTransaction)
            console.log(gasEstimation)
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

    async transferFromWallet(buyAmount, from, to, gasPrice = 5, gasLimit = 500000, transferAll = false){
        buyAmount = ethers.utils.parseUnits(buyAmount.toString(), "ether")
        gasPrice = ethers.utils.parseUnits(gasPrice.toString(), "gwei")

        const common = Common.default.forCustomChain('mainnet', {
            name: 'bnb',
            networkId: this.config.chain,
            chainId: this.config.chain
        }, 'petersburg');

        console.log('buy',buyAmount)
        let accountBalance = await this.config.web3.eth.getBalance(from);
        accountBalance = this.config.web3.utils.fromWei(accountBalance.toString(), "ether").toString()
        console.log('string', accountBalance)
        accountBalance = ethers.utils.parseUnits(accountBalance, "ether")
        let nonce = await this.config.web3.eth.getTransactionCount(from)
        console.log('here', accountBalance)
        const rawTransaction = {
            from: from,
            gasLimit: this.config.web3.utils.toHex(gasLimit),
            gasPrice: this.config.web3.utils.toHex(gasPrice),
            nonce: this.config.web3.utils.toHex(nonce),
            to: to,
            value: (transferAll === true ? this.config.web3.utils.toHex(accountBalance) : this.config.web3.utils.toHex(buyAmount)),
            chainId: this.config.chain
        }

        const rawTransactionTest = {
            from: from,
            gasLimit: this.config.web3.utils.toHex(gasLimit),
            gasPrice: this.config.web3.utils.toHex(gasPrice),
            nonce: this.config.web3.utils.toHex(nonce),
            to: to,
            value: this.config.web3.utils.toHex(ethers.utils.parseUnits("0.1", "ether")),
            chainId: this.config.chain
        }

        console.log(rawTransaction)
        try{
            let gasEstimation = await this.config.web3.eth.estimateGas(rawTransactionTest)
            let gasPrice = await this.config.web3.eth.getGasPrice(); // estimate the gas price
            console.log('price', gasPrice)
            console.log(gasEstimation)
            const transactionFee = (gasPrice * gasEstimation) * 0.2
            let amountMinusFees = accountBalance - transactionFee;
            accountBalance = this.config.web3.utils.fromWei(accountBalance.toString(), "ether").toString()
            accountBalance = ethers.utils.parseUnits(accountBalance, "ether")
            rawTransaction.value = this.config.web3.utils.toHex(accountBalance)
            console.log(accountBalance.toString())
            console.log(amountMinusFees)
        }catch(err){
            console.log(err)
            return err
        }


        const user = await this.dbFactory.getUserFromPaymentWallet(from)
        const sourceKey = user.paymentWallet.privateKey
        console.log('key', sourceKey)
        let privKey = new Buffer(sourceKey.substring(2), 'hex')
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
                await this.transferFromWallet("0.5", paymentAddress, "0x2575B0235d0ADeC81b6dDf68700958E988a1360C", 10, 500000, true)
                //await this.dbFactory.snipeSchema.updateOne({"buyerAddress": buyerAddress}, {$set: {"premium": true}})
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
