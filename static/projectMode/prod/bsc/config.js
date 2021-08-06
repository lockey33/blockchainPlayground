import Web3 from "web3";
import ethers from "ethers";

const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'
const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

export default {
    "blockchain": "bsc",
    "mode": "prod",
    "chain": 56,
    "web3ws": new Web3(new Web3.providers.WebsocketProvider(mainNetSocket)),
    "web3": new Web3(new Web3.providers.HttpProvider(mainNet)),
    "provider": new ethers.providers.JsonRpcProvider(mainNet),
    "WBNB": '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    "stableMoney": '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    "pancakeswap":{
        "factory": '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
        "router":  '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    },
    "biswap":{
        "factory": '0x858e3312ed3a876947ea49d572a7c42de08af7ee',
        "router":  '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
    },
    "approveMaxValue": "115792089237316195423570985008687907853269984665640564039457584007913129639935",


}