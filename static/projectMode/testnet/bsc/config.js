import Web3 from "web3";
import ethers from "ethers";

const testNet = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
const testNetSocket = 'wss://data-seed-prebsc-1-s1.binance.org:8545/'

export default {
    "blockchain": "bsc",
    "mode": "dev",
    "chain": 97,
    "web3ws": new Web3(new Web3.providers.WebsocketProvider(testNetSocket)),
    "web3": new Web3(new Web3.providers.HttpProvider(testNet)),
    "provider": new ethers.providers.JsonRpcProvider(testNet),
    "WBNB": '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    "stableMoney": '0x8301f2213c0eed49a7e28ae4c3e91722919b8b47',
    "factory": '0x6725f303b657a9451d8ba641348b6761a6cc7a17',
    "router":  '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    "approveMaxValue": "115792089237316195423570985008687907853269984665640564039457584007913129639935",

}