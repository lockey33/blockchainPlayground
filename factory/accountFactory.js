
export default class AccountFactory {

    constructor(globalFactory) {
        this.config = globalFactory.config
        this.contractManager = globalFactory.contractManager
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
