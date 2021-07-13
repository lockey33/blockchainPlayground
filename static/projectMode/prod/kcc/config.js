import Web3 from "web3";
import ethers from "ethers";

const mainNet = 'https://rpc-mainnet.kcc.network'
const mainNetSocket = 'wss://rpc-ws-mainnet.kcc.network'
const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

export default {
    "blockchain": "kcc",
    "priceUsd": null,
    "mode": "prod",
    "chain": 321,
    "web3ws": new Web3(new Web3.providers.WebsocketProvider(mainNetSocket)),
    "web3": new Web3(new Web3.providers.HttpProvider(mainNet)),
    "provider": new ethers.providers.JsonRpcProvider(mainNet),
    "WBNB": '0x4446Fc4eb47f2f6586f9fAAb68B3498F86C07521',
    "stableMoney": '0x980a5afef3d17ad98635f6c5aebcbaeded3c3430',
    "factory": '0xC0fFeE00000e1439651C6aD025ea2A71ED7F3Eab',
    "router":  '0xc0ffee0000c824d24e0f280f1e4d21152625742b',
    "approveMaxValue": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
}