import {ChainId} from "../../../factory/pancakeswap-sdk-v2/dist/index.js";
import Web3 from "web3";
import ethers from "ethers";
import PANCAKE from "../../../factory/abis/pancake.js";
import ERC20 from "../../../factory/abis/erc20.js";

const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'
const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

export default {
    "mode": "prod",
    "chain": ChainId.MAINNET,
    "web3ws": new Web3(new Web3.providers.WebsocketProvider(mainNetSocket)),
    "web3": new Web3(new Web3.providers.HttpProvider(mainNet)),
    "provider": new ethers.providers.JsonRpcProvider(mainNet),
    "WBNB": '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    "factory": '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    "router":  '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    "approveMaxValue": "115792089237316195423570985008687907853269984665640564039457584007913129639935",


}