import GlobalFactory from "./factory/globalFactory.js"
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";
import Common from "ethereumjs-common";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Tx = require('ethereumjs-tx').Transaction

const factory =  new GlobalFactory("prod", myAccounts.account1)

const presaleAddress = ethers.utils.getAddress("0x331a66fE53f028453b88Eb3001d8e2C5955c9544")
const tokenAddress = ethers.utils.getAddress("0xa0cF1a30D845441a4E51c29FE6c2Be1329129C33")
const buyAmount = ethers.utils.parseUnits("0.1", "ether")


async function sendTransaction(){
    const common = Common.default.forCustomChain('mainnet', {
        name: 'bnb',
        networkId: 56,
        chainId: 56
    }, 'petersburg');

    let nonce = await factory.config.web3.eth.getTransactionCount(factory.config.recipient)

    let rawTransaction = {
        from: factory.config.recipient,
        gasLimit: 200000,
        gasPrice: 10,
        nonce: factory.config.web3.utils.toHex(nonce),
        to: presaleAddress,
        value: factory.config.web3.utils.toHex(buyAmount),
        chainId: 56
    }

    let privKey = new Buffer(factory.config.privateKey, 'hex');
    let transaction = new Tx(rawTransaction, {common})
    let estimatedGas = await factory.config.web3.eth.estimateGas(rawTransaction)
    //transaction.sign(privKey)
    console.log(estimatedGas)

    /*

    const serializedTx = transaction.serialize().toString('hex')
    let sendTransaction = await factory.config.web3.eth.sendSignedTransaction('0x' + serializedTx)
    console.log(sendTransaction)
    return sendTransaction*/

}

sendTransaction()


