'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _ethers = require('ethers');

var _ethers2 = _interopRequireDefault(_ethers);

var _erc = require('./abis/erc20.js');

var _erc2 = _interopRequireDefault(_erc);

var _pancake = require('./abis/pancake.js');

var _pancake2 = _interopRequireDefault(_pancake);

var _wbnb = require('./abis/wbnb.js');

var _wbnb2 = _interopRequireDefault(_wbnb);

var _approveSpender = require('./abis/approveSpender.js');

var _approveSpender2 = _interopRequireDefault(_approveSpender);

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

var _sdkV = require('@pancakeswap-libs/sdk-v2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mainNet = 'https://bsc-dataseed.binance.org/';
var mainNetSocket = 'wss://bsc-ws-node.nariox.org:443';
var testNetBlockIoSocket = 'wss://bsc.getblock.io/testnet/';
var testNetBlockIo = 'https://bsc.getblock.io/testnet/';
var testNetSocket = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
var testNet = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
var ganacheFork = 'http://127.0.0.1:7545';
var ganacheForkSocket = 'ws://127.0.0.1:8545';

process.env.NODE_ENV = 'production';

var SwapFactory = function () {
    function SwapFactory(mode, account, privateKey) {
        _classCallCheck(this, SwapFactory);

        if (mode === "test") {
            this.chain = _sdkV.ChainId.BSCTESTNET;
            this.mode = mode;
            this.web3ws = new _web2.default(new _web2.default.providers.WebsocketProvider(testNetSocket));
            this.web3 = new _web2.default(new _web2.default.providers.HttpProvider(testNet));
            this.provider = new _ethers2.default.providers.JsonRpcProvider(testNet);
            this.signer = new _ethers2.default.Wallet(privateKey, this.provider);
            this.privateKey = privateKey;
            this.WBNB = '0xae13d989dac2f0debff460ac112a837c89baa7cd';
            this.factory = '0x6725f303b657a9451d8ba641348b6761a6cc7a17';
            this.router = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
            this.recipient = account;
        } else if (mode === "ganache") {
            this.mode = mode;
            this.chain = _sdkV.ChainId.MAINNET;
            //this.web3ws = new Web3(new Web3.providers.WebsocketProvider(ganacheForkSocket))
            this.web3 = new _web2.default(new _web2.default.providers.HttpProvider(ganacheFork));
            this.provider = new _ethers2.default.providers.JsonRpcProvider(ganacheFork);
            this.signer = new _ethers2.default.Wallet(privateKey, this.provider);
            this.privateKey = privateKey;
            this.WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
            this.factory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
            this.router = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
            this.recipient = account;
            this.routerFreeContract = this.getFreeContractInstance(this.router, _pancake2.default, this.provider);
            this.routerPaidContract = this.getPaidContractInstance(this.router, _pancake2.default, this.provider);
            this.WBNBFreeContract = this.getFreeContractInstance(this.WBNB, _erc2.default, this.provider);
            this.WBNBPaidContract = this.getPaidContractInstance(this.WBNB, _erc2.default, this.provider);
        } else {
            this.mode = mode;
            this.chain = _sdkV.ChainId.MAINNET;
            this.web3ws = new _web2.default(new _web2.default.providers.WebsocketProvider(mainNetSocket));
            this.web3 = new _web2.default(new _web2.default.providers.HttpProvider(mainNet));
            this.provider = new _ethers2.default.providers.JsonRpcProvider(mainNet);
            this.signer = new _ethers2.default.Wallet(privateKey, this.provider);
            this.privateKey = privateKey;
            this.WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
            this.factory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
            this.router = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
            this.recipient = account;
            this.routerFreeContract = this.getFreeContractInstance(this.router, _pancake2.default, this.provider);
            this.routerPaidContract = this.getPaidContractInstance(this.router, _pancake2.default, this.provider);
            this.WBNBFreeContract = this.getFreeContractInstance(this.WBNB, _erc2.default, this.provider);
            this.WBNBPaidContract = this.getPaidContractInstance(this.WBNB, _erc2.default, this.provider);
        }
        this.wallet = new _ethers2.default.Wallet(this.privateKey);
        this.approveMaxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    }

    _createClass(SwapFactory, [{
        key: 'getAccountBalance',
        value: async function getAccountBalance() {
            var balance = await this.provider.getBalance(this.wallet.address);
            console.log('account balance', balance);
            return balance;
        }
    }, {
        key: 'getFreeContractInstance',
        value: async function getFreeContractInstance(contractAdress, abi) {
            var signerOrProvider = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.provider;

            var contract = new _ethers2.default.Contract(contractAdress, abi, signerOrProvider);
            return contract;
        }
    }, {
        key: 'getPaidContractInstance',
        value: async function getPaidContractInstance(contractAdress, abi) {
            var signerOrProvider = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.provider;

            var contract = new _ethers2.default.Contract(contractAdress, abi, signerOrProvider);
            return contract;
        }
    }, {
        key: 'callContractMethod',
        value: async function callContractMethod(contractInstance, methodName) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var transactionOptions = arguments[3];

            var resultOfCall = null;
            var owner = this.recipient;
            var spender = this.router;
            var swapMethod = methodName;
            if (methodName.includes('swap')) {
                methodName = "router";
            }
            if (options.hasOwnProperty("spender")) {
                spender = options.spender;
            }
            switch (methodName) {
                case "deposit":
                    resultOfCall = await contractInstance[methodName](options);
                    break;
                case "allowance":
                    resultOfCall = await contractInstance[methodName](owner, spender);
                    break;
                case "approve":
                    resultOfCall = await contractInstance[methodName](spender, options.value);
                    break;
                case "balanceOf":
                    resultOfCall = await contractInstance[methodName](owner);
                    break;
                case "router":
                    resultOfCall = await contractInstance[swapMethod].apply(contractInstance, _toConsumableArray(options).concat([transactionOptions]));
                    break;
                default:
                    resultOfCall = await contractInstance[methodName]();
                    break;
            }

            return resultOfCall;
        }
    }, {
        key: 'estimateGasForContract',
        value: async function estimateGasForContract(contractInstance, methodName) {
            var estimatedGas = await contractInstance.estimateGas[methodName];
            return estimatedGas;
        }
    }, {
        key: 'formatAmount',
        value: async function formatAmount(parsedAmount) {
            if (parsedAmount === 0) {
                console.log("Le token n'est pas encore dans mon portefeuille");
                return 0;
            }
            if (parsedAmount instanceof _sdkV.CurrencyAmount) {
                return parsedAmount.toExact();
            } else {
                return parsedAmount.toSignificant(6);
            }
        }
    }, {
        key: 'getToken',
        value: async function getToken(address, decimals) {
            if (this.mode === "test") {
                console.log('test');
                return new _sdkV.Token(_sdkV.ChainId.BSCTESTNET, address, decimals);
            }
            return new _sdkV.Token(_sdkV.ChainId.MAINNET, address, decimals);
        }
    }, {
        key: 'fetchPair',
        value: async function fetchPair(tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals) {
            var inputTokenInstance = await this.getToken(tokenIn, tokenInDecimals);
            var outputTokenInstance = await this.getToken(tokenOut, tokenOutDecimals);
            var pair = await _sdkV.Fetcher.fetchPairData(inputTokenInstance, outputTokenInstance, this.provider);
            var route = new _sdkV.Route([pair], _sdkV.WETH[inputTokenInstance.chainId]);

            var pairData = {
                tokenPriceInBnb: route.midPrice.toSignificant(6), // 1 token = tant de bnb
                bnbPriceForOneToken: route.midPrice.invert().toSignificant(6), // 1 bnb = tant de tokens
                route: route,
                pair: pair
            };

            return pairData;
        }
    }, {
        key: 'parseAmount',
        value: async function parseAmount(value, currency, tokenContractInstance) {
            var decimals = await swapFactory.callContractMethod(tokenContractInstance, 'decimals');
            var typedValueParsed = _ethers2.default.utils.parseUnits(value, decimals).toString();
            if (typedValueParsed !== '0') {
                return currency instanceof _sdkV.Token ? new _sdkV.TokenAmount(currency, _sdkV.JSBI.BigInt(typedValueParsed)) : _sdkV.CurrencyAmount.ether(_sdkV.JSBI.BigInt(typedValueParsed));
            }
        }
    }, {
        key: 'parseCurrency',
        value: async function parseCurrency(value) {
            var typedValueParsed = _ethers2.default.utils.parseUnits(value, 18).toString();
            if (typedValueParsed !== '0') {
                return new _sdkV.CurrencyAmount.ether(_sdkV.JSBI.BigInt(typedValueParsed));
            }
        }
    }, {
        key: 'parseToken',
        value: async function parseToken(value, tokenInstance, tokenContractInstance) {
            var decimals = await swapFactory.callContractMethod(tokenContractInstance, 'decimals');
            var typedValueParsed = _ethers2.default.utils.parseUnits(value, decimals).toString();
            if (typedValueParsed !== '0') {
                return new _sdkV.TokenAmount(tokenInstance, _sdkV.JSBI.BigInt(typedValueParsed));
            }
            return 0;
        }
    }, {
        key: 'swap',
        value: async function swap(tokenIn, tokenOut, value) {
            var allowedSlippage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 12;


            //Contracts

            var tokenInContractInstance = await swapFactory.getFreeContractInstance(tokenIn, _erc2.default),
                paidTokenInContractInstance = await swapFactory.getPaidContractInstance(tokenIn, _erc2.default, this.signer),
                tokenOutContractInstance = await swapFactory.getFreeContractInstance(tokenOut, _erc2.default),
                paidTokenOutContractInstance = await swapFactory.getPaidContractInstance(tokenOut, _erc2.default, this.signer),
                routerContractInstance = await swapFactory.getPaidContractInstance(this.router, _pancake2.default, this.signer);

            //Tokens
            var tokenInDecimals = await this.callContractMethod(tokenInContractInstance, "decimals");
            var tokenOutDecimals = await this.callContractMethod(tokenOutContractInstance, "decimals");
            var tokenInInstance = new _sdkV.Token(this.chain, tokenIn, tokenInDecimals);
            var tokenOutInstance = new _sdkV.Token(this.chain, tokenOut, tokenOutDecimals);

            var pairData = await this.fetchPair(tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals);
            //console.log(pairData)
            //Pair and route
            var pair = pairData.pair;
            var route = new _sdkV.Route([pair], tokenInInstance);
            //console.log(route)
            /*        //convert value wanted for swap in CurrencyAmount Object
            
                    //Create trade
                    const typedValueParsed = ethers.utils.parseUnits(value.toString(), tokenInDecimals)
                    const trade = new Trade(route, new TokenAmount(tokenInInstance, typedValueParsed), TradeType.EXACT_INPUT)
                    const tradeOptions = await this.getTradeOptions(allowedSlippage, false)
            
                    // Approve both tokens only if needed
                    //await this.approveIfNeeded(tokenInContractInstance, tokenOutInstance, paidTokenInContractInstance, paidTokenOutContractInstance, value)
            
            
            /!*        let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
                    let contract = new ethers.Contract(tokenIn, abi, this.signer)
                    const tx = await contract.approve(this.router, ethers.utils.parseUnits('1000.0', 18), {gasLimit: 100000, gasPrice: 5e9})
                    console.log('Transaction receipt');
                    console.log(tx);*!/
            
                    //await this.makeDepositOfWBNB(paidTokenInContractInstance, new CurrencyAmount.ether(JSBI.BigInt(50)))
                    const checkTokenInBalance = await this.checkTokenBalance(tokenInContractInstance, tokenInInstance, true)
                    const checkTokenOutBalance = await this.checkTokenBalance(tokenOutContractInstance, tokenOutInstance, true)
                    console.log('balance tokenIn', checkTokenInBalance)
                    console.log('balance tokenOut', checkTokenOutBalance)
            
                    let swap = Router.swapCallParameters(trade, tradeOptions)
                    console.log(swap)
                    let gasPrice = ethers.utils.parseUnits('5', 'gwei')
                    let gasLimit = this.calculateGasMargin(gasPrice)
                    let transactionOptions = {gasPrice: gasPrice, gasLimit: 200000}
                    //console.log(swap)
                    let estimateGas = await routerContractInstance.estimateGas[swap.methodName](...swap.args, transactionOptions)
                    console.log(estimateGas)
                    let result = await swapFactory.callContractMethod(routerContractInstance, swap.methodName, swap.args, transactionOptions)
                    console.log(result)
                    return trade*/
        }
    }, {
        key: 'makeDepositOfWBNB',
        value: async function makeDepositOfWBNB(tokenInContractInstance, inputAmount) {
            try {
                var deposit = await swapFactory.callContractMethod(tokenInContractInstance, "deposit", { value: '0x' + inputAmount.raw.toString(16) });
                var waitDeposit = await deposit.wait();
            } catch (err) {
                console.log('deposit failed', err);
                process.exit();
            }

            return true;
        }
    }, {
        key: 'checkTokenBalance',
        value: async function checkTokenBalance(tokenContractInstance, tokenInstance, readable) {
            var balanceOfToken = await swapFactory.callContractMethod(tokenContractInstance, 'balanceOf', this.recipient);
            if (tokenContractInstance.address === this.WBNB) {
                if (balanceOfToken.isZero()) {
                    console.log('Aucun WBNB disponible pour le trade');
                    process.exit();
                }
                if (readable) {
                    var balance = await swapFactory.parseCurrency(balanceOfToken.toString());
                    return await swapFactory.formatAmount(balance);
                }
                return await swapFactory.parseCurrency(balanceOfToken.toString());
            }

            if (readable) {
                var _balance = await swapFactory.parseToken(balanceOfToken.toString(), tokenInstance, tokenContractInstance);
                return await swapFactory.formatAmount(_balance);
            }
            return await swapFactory.parseToken(balanceOfToken.toString(), tokenInstance, tokenContractInstance);
        }
    }, {
        key: 'approveIfNeeded',
        value: async function approveIfNeeded(tokenInContractInstance, tokenOutInstance, paidTokenInContractInstance, paidTokenOutContractInstance, value) {

            //const allowanceTokenIn = await this.getAllowance(tokenInContractInstance)
            //const allowanceTokenOut = await this.getAllowance(tokenOutContractInstance)
            var allowanceTokenIn = _ethers2.default.BigNumber.from(0);
            var allowanceTokenOut = _ethers2.default.BigNumber.from(0);
            try {
                if (allowanceTokenIn.lt(value)) {
                    console.log('no allowance for token in');
                    var spenderContract = await swapFactory.getPaidContractInstance("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", _approveSpender2.default, this.signer);

                    var approveIn = await this.callContractMethod(spenderContract, 'approve', { spender: this.router, value: this.approveMaxValue });
                    var waitApprovedIn = await approveIn.wait();
                }
                if (allowanceTokenOut.lt(value)) {
                    console.log('no allowance for token out');
                    var approveOut = await this.callContractMethod(paidTokenOutContractInstance, 'approve', { spender: this.router, value: this.approveMaxValue });
                    var waitApprovedOut = await approveOut.wait();
                }
                console.log('money allowed for tokens');
            } catch (err) {
                console.log('approve error', err);
                return false;
            }

            return true;
        }
    }, {
        key: 'getTradeOptions',
        value: async function getTradeOptions(allowedSlippage) {
            var feeOnTransfer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return {
                allowedSlippage: new _sdkV.Percent(_sdkV.JSBI.BigInt(Math.floor(allowedSlippage)), _config2.default.BIPS_BASE),
                ttl: 60 * 20,
                recipient: await this.checkSum(this.recipient),
                feeOnTransfer: feeOnTransfer
            };
        }
    }, {
        key: 'calculateGasMargin',
        value: function calculateGasMargin(value) {
            return value.mul(_ethers2.default.BigNumber.from(10000).add(_ethers2.default.BigNumber.from(1000))).div(_ethers2.default.BigNumber.from(10000));
        }
    }, {
        key: 'getAllowance',
        value: async function getAllowance(contract) {
            var allowance = this.callContractMethod(contract, 'allowance');
            return allowance;
        }
    }, {
        key: 'checkSum',
        value: async function checkSum(address) {
            return _ethers2.default.utils.getAddress(address);
        }
    }]);

    return SwapFactory;
}();

//let swapFactory = new SwapFactory("test", config.testNetAccount,  config.testNetKey)
//let swapFactory = new SwapFactory("ganache", config.ganacheAccount,  config.ganacheKey)
//let swapFactory = new SwapFactory("prod", config.mainNetAccount,  config.mainNetKey)
//let trade = await swapFactory.swap("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x5e90253fbae4dab78aa351f4e6fed08a64ab5590", 1, 12)
///let trade = await swapFactory.swap("0xae13d989dac2f0debff460ac112a837c89baa7cd", "0xe4ddd2daef89d7483917bcc2fd55f361585fd2d3", 1, 12)