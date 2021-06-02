import Web3 from 'web3'
import ethers from 'ethers'
import ERC20 from './abis/erc20.js'
import PANCAKE from './abis/pancake.js'
import WBNB from './abis/wbnb.js'
import approveSpender from "./abis/approveSpender.js";
import config from './config.js'
const mainNet = 'https://bsc-dataseed.binance.org/'
const mainNetSocket = 'wss://bsc-ws-node.nariox.org:443'

const quickHttp = 'https://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'
const quickSocket = 'wss://purple-weathered-moon.bsc.quiknode.pro/4aca6a71de78877d5bdfeeaf9d5e14ef2da63250/'

const testNetBlockIoSocket = 'wss://bsc.getblock.io/testnet/'
const testNetBlockIo = 'https://bsc.getblock.io/testnet/'
const testNetSocket = 'wss://data-seed-prebsc-1-s1.binance.org:8545/'
const testNet = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
const ganacheFork = 'http://127.0.0.1:7545'
const ganacheForkSocket = 'ws://127.0.0.1:8545'

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const txDecoder = require('ethereum-tx-decoder');
const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder('./abis/pancake.json');
import swapFactory from "./factory/swapFactory.js";


swapFactory.pendingTransaction(mainNetSocket)

