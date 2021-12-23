import Web3 from "web3";
import ethers from "ethers";

const mainNet = 'https://api.avax.network/ext/bc/C/rpc'
const mainNetSocket = 'wss://api.avax.network/ext/bc/C/rpc'
const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

export default {
    "blockchain": "avax",
    "mode": "prod",
    "chain": 43114,
    "web3ws": new Web3(new Web3.providers.WebsocketProvider(mainNetSocket)),
    "web3": new Web3(new Web3.providers.HttpProvider(mainNet)),
    "provider": new ethers.providers.JsonRpcProvider(mainNet),
    "WBNB": '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    "stableMoney": '0xc7198437980c041c805a1edcba50c1ce5db95118',
    "pancakeswap":{
        "factory": '0x9ad6c38be94206ca50bb0d90783181662f0cfa10',
        "router":  '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
    },
    "biswap":{
        "factory": '0x858e3312ed3a876947ea49d572a7c42de08af7ee',
        "router":  '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
    },
    "approveMaxValue": "115792089237316195423570985008687907853269984665640564039457584007913129639935",


}