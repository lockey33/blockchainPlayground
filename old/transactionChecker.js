const Web3 = require('web3');

class TransactionChecker {
    web3;
    web3ws;
    account;
    subscription;

    constructor(account) {
        this.web3ws = new Web3(new Web3.providers.WebsocketProvider('wss://bsc-ws-node.nariox.org:443'));
        this.web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));
        this.account = account.toLowerCase();
    }

    subscribe(topic) {
        this.subscription = this.web3ws.eth.subscribe(topic, (err, res) => {
            if (err) console.error(err);
        });
    }

    watchTransactions() {
        console.log('Watching all pending transactions...');
        console.log(this.web3.utils.toAscii("0x000000000000000000000000000000000000000000000000192e12eda14fb4e5"))

/*        this.subscription.on('data', (txHash) => {
            setTimeout(async () => {
                try {
                    let tx = await this.web3.eth.getTransaction(txHash);
                    if (tx != null && tx.to != null) {
                        try{
                            let tx_data = tx.input;
                            let input_data = '0x' + tx_data.slice(10);  // get only data without function selector
                            let params = this.web3.eth.abi.decodeParameters(['bytes32', 'string', 'string', 'string'], input_data);
                            console.log(params)
                            const decodedInput = inter.parseTransaction({ data: tx.data, value: tx.value});
                            if (this.account == tx.to.toLowerCase()) {

                                console.log({hash: tx.hash, address: tx.from, gas: tx.gas, gasPrice: tx.gasPrice, value: this.web3.utils.fromWei(tx.value, 'ether'), timestamp: new Date()});
                            }
                        }catch(err){
                            //console.log('err', err)
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            }, 1)
        });*/
    }
}

let txChecker = new TransactionChecker('0x5e90253fbae4dab78aa351f4e6fed08a64ab5590');
txChecker.subscribe('pendingTransactions');
txChecker.watchTransactions();