'use strict';

var ethers = require("ethers");
var Web3 = require('web3');
var pancakeAbi = require('./abi/pancake.json');
var wbnbAbi = require('./abi/wbnb.json');
var helperAbi = require('./abi/helper.json');
var approveSpenderAbi = require('./abi/approveSpender.json');
var addresses = {
    WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    recipient: '0x145239daBd91E2F3AD3D3A00C654c8FDa7bA5Fcc'

    //First address of this mnemonic must have enough BNB to pay for tx fess
};var privateKey = "ba65fb51edf8aa3e97a3beea9fdde2786a3acad63c4714da1b30313f53d99c96"; //prod
var mainNet = "https://bsc.getblock.io/mainnet/?api_key=811a98b6-09f6-4fc8-a7f8-71112672ab97";

var web3 = new Web3(new Web3.providers.HttpProvider(mainNet));
var provider = new ethers.providers.JsonRpcProvider(mainNet);
var wallet = new ethers.Wallet(privateKey);
var account = wallet.connect(provider);
var approveMaxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

var factory = new ethers.Contract(addresses.factory, ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'], account);
var router = new ethers.Contract(addresses.router, ['function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)', 'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'], account);

var pairsSave = ['0x691912376C8F057d74909f036D0e5211Fe50837a', '0x073d7e7810640F9AF754308c8160e485B0eA59aB', '0xBd9a0B1462961c83AAAaEcfB30b7925Df856FeC8', '0xDBE02474AF4536F7a052acc3b62230ec25D465fd', '0xEDFfd370f6f14AA15B85292E67F73E24dE50Ca6D', '0x39fe9eb1f80d868B380EecA31951207d8A804A39', '0x3f4255B83C635988b95E8610085F62410913BbB1', '0x95Ed589A832037675212d20716e84a3102Ba6AF7', '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', '0x9e15EB9fE229729Bd31Eb464070512CCb6e41C8E', '0x2fc97C6eCde4f18Ff9573fdD2d38F0D64506E096', '0x4a381789680A25981446221A051C965d8d5A12F7', '0x3d9F7b2015b854db1511a84aEdF24bb397325F76', '0xB1c5eb23dd64D3576cC6febC48b66415c910f628', '0x8211d3dE0c2eb38c645e41F91C6d9CE621dC66b8', '0x67b63215c65F52540E5FF6b9495c432E0BE6665C', '0xdc0a3F2568088D7B1646dbd86Aa33767728dF611', '0x1d7024078f14309D438a574C5D09046e992E5ceF', '0x46839B5222D96E646a22734c46686C02049C7A1B', '0x4445E29687b864CcA9e528E073682548d0EC40AD', '0xE8b7ED00AB779AD369c357C2196745e769A70Ae7', '0x66fE1c0cEa0d17B3F4C623cDDb087Fc7C6B16Bd5', '0xb397E516C6E0F65bB78dD47ADfbc9dE3559a2C91', '0x7ceEAC5c71E55C46443Bd860259C7b989eBcaBED', '0x77844530F78768f72bb3b7a8813064c79d48aE2F', '0x74b1af546a7493B7103827CcA761BF822f9b7BBC', '0x4727c40F4BFEE9679ffFCF1D585A6CFFF14aA5df', '0x38bC928532a2B3C5A022169c2704be8E0E8cD127', '0xFB57EC7Ad2ABC2eC2c58977E8F17af2CA253951f', '0x06bA0979F7fB48f8fE2181f83DadB30f80dCE1a3', '0x147bA5878a8c3759e7DDa557E0507Ef7e69180fE', '0xfBA4c9f45528094461caDf79c112e396844a06b9', '0x9A8B2657fFB6f95151077b06953Cd4Ab164afb7A', '0x1DFB3f568edDBf613d9b0AFf14b34Aa61ba242F3', '0x6d5645be9302BFF6aD31a1D0a9DDd99BA3ac51c6', '0x8Bf8C6341bCe5dEE5a7B0aacA12eD98f73aAEf0F', '0xAC01DDdA2f323bf5c7603A4e9A2bBA6FA7962790', '0xaA8F895F760a35Fb7f43af98131F720c5F4778c9', '0x772BbaFA25D777164938f9140dAe38A0FbfcCE8a', '0xFc61C32d94b70B6A504Da4C79f13D6a8fDE28630', '0x8BdE20b33fbb8a5a1bC4cC2d5d2372ABf2971f3b', '0x11a90b2F2fF86Db7aA54A622D6610bDF54998652', '0x86006296dfe34Fa01b64bA4f24cDfC3d4214CF3b', '0xC16E337F8777D4Aa175089d76428307f10398e45', '0x035798c9Bd69c1dDD1970b9eF0F2A12BDf912a84', '0x132D8b8827CE576F0e308FD2f3641c44C893b40E', '0xb3512a80EfB48F0362B86330ccAEbDdE1C5F014d', '0xB921483262d1F7f7cf443CbA496893Ea764bCe3b', '0xdCB5102A9AAe0F9E94a862Ef63Eb79B04dA38dA9', '0x95c7c22cF59ba4A6fCBE7C5fc9e4135e2557833a', '0xF0558FeE062e02a4c60069f6d317814b06c6A35e', '0x23802D8f87C98D38D6b58C2e6db5436B4A1d44ed', '0xC44c7c7C1Ca32B46C1F7017adf1BB413731182f8', '0x10aEA41270ACa1A4454262de18dcB60A5d899236', '0x8631FB0F90eC3b1dAC280B3045d63f8D795e25b2', '0x961332EC470b3583290959f684b07D275eC35996', '0x73712E01461648b87c8D47226C83e594cB6D4561', '0x1f20CFeE855c59E4507c10FCAb380A0fa55fB923', '0xc0B979Fc9c91957847406C40FaC48E337a9ac364', '0xA861E3a741FBAf298d531DFe58b2a9f987aEF1F0', '0x845c3D09e5d3A4C7c1e77323239eaB0Aacd31469', '0xa63E2a2442902720C73Bbb1313Bf4Cc72f083E29', '0xd63A7DD939f4b623c75c9C636935Be19E4E48c9F', '0x846bf7B37b1cD39a2F1F2768Fc7d05d5ADE9a9B7', '0xdF892264aEF057533D221399418f7AB30e2f6051'];

var pairs = [];

factory.on('PairCreated', async function (token0, token1, pairAddress) {
    console.log('\n    New pair detected\n    =================\n    token0: ' + token0 + '\n    token1: ' + token1 + '\n    pairAddress: ' + pairAddress + '\n  ');
    var tokenOut = null;
    if (token1 === "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c") {
        tokenOut = token0;
        pairs.push(tokenOut);
    } else {
        tokenOut = token1;
        pairs.push(tokenOut);
    }
    var tokenIn = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    var balanceTokenIn = ethers.utils.parseUnits("1", 'ether');
    var liquidity = false;
    var initialAmountIn = false;
    var initialAmountOut = false;
    try {
        liquidity = await checkLiquidity(balanceTokenIn, tokenIn, tokenOut);
        initialAmountIn = readableNumber(liquidity[0]);
        initialAmountOut = readableNumber(liquidity[1]);
    } catch (err) {
        console.log('pas de liquidité');
    }
    await createIntervalForCoin(balanceTokenIn, tokenIn, tokenOut, initialAmountIn, initialAmountOut, liquidity);
    console.log(pairs);
});

async function createIntervalForCoin(balanceTokenIn, tokenIn, tokenOut, initialAmountIn, initialAmountOut, liquidity) {
    var waitProfit = setInterval(async function () {
        if (liquidity !== false) {
            var amounts = await router.getAmountsOut(balanceTokenIn, [tokenIn, tokenOut]);
            var actualAmountIn = readableNumber(amounts[0]);
            var actualAmountOut = readableNumber(amounts[1]);
            var increasePourcentage = calculateIncrease(initialAmountOut, actualAmountOut);
            if (increasePourcentage > 10 || increasePourcentage < -10) {
                console.log('----------------');
                console;
                console.log("increasePourcentage : " + increasePourcentage + "% " + tokenOut);
                console.log('----------------');
            }
        }
    }, 20000);
}

async function checkLiquidity(balanceTokenIn, tokenIn, tokenOut) {

    try {
        return await router.getAmountsOut(balanceTokenIn, [tokenIn, tokenOut]);
    } catch (err) {
        //console.log("pas de liquidité")
        return false;
    }
}

function readableNumber(number) {
    number = number / Math.pow(10, 18);
    return number.toFixed(4);
}

function calculateIncrease(originalAmount, newAmount) {
    var increase = newAmount - originalAmount; // 100 - 70 = 30
    //console.log(newAmount , originalAmount)
    increase = increase / originalAmount; //  30/ 70
    increase = increase * 100;
    increase = Math.round(increase);
    return increase;
}