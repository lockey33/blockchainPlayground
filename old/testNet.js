const ethers = require("ethers");
const Web3 = require('web3');
const pancakeAbi = require('../abi/pancake.json');
const wbnbAbi = require('../abi/wbnb.json');
const helperAbi = require('../abi/helper.json');
const approveSpenderAbi = require('../abi/approveSpender.json');
const testNet = "https://bsc-testnet.web3api.com/v1/YG5ZXZX9AX6TA9NZAEX71SR8FAAFYPSCVX";
const publicTestNet = "https://data-seed-prebsc-1-s1.binance.org:8545/"

const mainNet = "https://bsc-mainnet.web3api.com/v1/YG5ZXZX9AX6TA9NZAEX71SR8FAAFYPSCVX";
const mainPublicSocket = "wss://bsc-ws-node.nariox.org:443";
const mainNetHttp = "https://bsc-dataseed.binance.org/"
const localMainNet = "http://localhost:8545";



const { TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')
const input = require('input') // npm i input

const apiId = 4792862
const apiHash = '1db38acb41a7c8794aaf203564281b12'

let stringSession = new StringSession(''); // fill this later with the value from session.save()
(async () => {
    console.log('Loading interactive example...')
    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 })
    await client.start({
        phoneNumber: async () => await input.text('number ?'),
        password: async () => await input.text('password?'),
        phoneCode: async () => await input.text('Code ?'),
        onError: (err) => console.log(err),
    });
    console.log('You should now be connected.')
    console.log(client.session.save()) // Save this string to avoid logging in again
    stringSession = client.session.save()
    await client.sendMessage('me', { message: 'Hello!' });
})()

const addresses = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', //prod
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', //prod
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //prod
    recipient: '0x145239daBd91E2F3AD3D3A00C654c8FDa7bA5Fcc' //prod
    /*    WBNB: '0xae13d989dac2f0debff460ac112a837c89baa7cd',
        factory: '0x6725f303b657a9451d8ba641348b6761a6cc7a17',
        router: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
        recipient : '0x5b5aA4667AD3F28056981447B3e42fD8829cBE74'*/
}
const privateKey = "ba65fb51edf8aa3e97a3beea9fdde2786a3acad63c4714da1b30313f53d99c96"; //prod
//const privateKey = "138cad384e45306faa5b00f46d9e481bc5c0f9e20bc4ba67e43e640a7f9ecbd3" //testnet
//const privateKey = "0xde62ba427e2272034633f5de39345e0df852de5ac56a1448ccb5010f128d9224" //local ganache

const web3 = new Web3(new Web3.providers.HttpProvider(mainNet));
const provider = new ethers.providers.JsonRpcProvider(mainNet)
const wallet = new ethers.Wallet(privateKey);
const account = wallet.connect(provider);
const approveMaxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935"

const router = new ethers.Contract(
    addresses.router,
    pancakeAbi,
    account
);


function truncateAmount(amount){

}


async function swapTokens(tokenIn, tokenOut, amount, gas) { //exchange token1 for token2


    let balance = await provider.getBalance(wallet.address)
    console.log('BNB balance', balance/ Math.pow(10, 18))

    try {
        let typeOfSwap = "buy"
        let contractTokenIn = new ethers.Contract(tokenIn, wbnbAbi, account)
        let contractTokenOut = new ethers.Contract(tokenOut, helperAbi, account)
        if(tokenIn !== addresses.WBNB){
            typeOfSwap = "sell"
            contractTokenIn = new ethers.Contract(tokenIn, approveSpenderAbi, account)
            contractTokenOut = new ethers.Contract(tokenOut, wbnbAbi, account)
        }


        let tokenInBalance = await contractTokenIn.balanceOf(addresses.recipient)
        let tokenOutBalance = await contractTokenOut.balanceOf(addresses.recipient)
        console.log("tokenInBalance :  ", tokenInBalance/ Math.pow(10, 18))
        console.log("tokenOutBalance : ", tokenOutBalance / Math.pow(10, 18))
        //balance of tokens

        //manage price of buy/sell
        let amountIn = ""
        let amountOutMin = ""
        if(typeOfSwap === "buy"){

            amountIn = ethers.utils.parseUnits(amount.toString(), 'ether');
            const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
            amountOutMin = amounts[1].sub(amounts[1].div(20));
        }else{
            if(amount === 100){// si je veux vendre 100% du token
                //amountIn = (tokenInBalance.mul(99)).div(100); //je multiplie par 99 au lieu de 100 sinon ça bug
                amountIn = tokenInBalance / Math.pow(10, 18)
                amountIn = amountIn.toFixed(4)
                console.log(amountIn)

                amountIn = ethers.utils.parseUnits(amountIn.toString(), "18")
            }else{
                amountIn = (tokenInBalance.mul(amount)).div(100); //*amount* is a pourcentage here
                amountIn = amountIn / Math.pow(10, 18)
                amountIn = amountIn.toFixed(2)
                amountIn = ethers.utils.parseUnits(amountIn.toString(), "18")
            }
        }


        //manage price of buy/sell

        console.log(`
            Buying new token
            =================
            tokenIn: ${amountIn.toString()} ${tokenIn} 
            tokenOut: ${amountOutMin.toString()} ${tokenOut}
        `);

        //gas price and gas limit
        let block = await web3.eth.getBlock("latest");
        let gasLimit = block.gasLimit / block.transactions.length
        gasLimit = Math.trunc(gasLimit)
        gasLimit = gasLimit * 2
        gasLimit = gasLimit.toString()
        console.log('normal', gasLimit)
        let gasPrice = ethers.utils.parseUnits(gas.toString(), "gwei")
        let transactionFee = gasPrice * gasLimit; // calculate the transaction fee
        console.log(transactionFee / Math.pow(10, 18))
        await approveToken(contractTokenIn, tokenIn, approveMaxValue, gasLimit, typeOfSwap,gas)
        console.log('approved')


        let receipt = null
        if (typeOfSwap === "sell") {
            console.log(amountIn)
            receipt = await sellTokenForBNB(amountIn, amountOutMin, tokenIn, tokenOut, addresses.recipient, gasLimit, gas)
        } else {
            console.log("buying " + tokenOut + " with WBNB")
            receipt = await buyTokenWithBNB(amountIn, amountOutMin, tokenIn, tokenOut, addresses.recipient, gasLimit, gas)
        }

        console.log('Transaction receipt');
        console.log(receipt);
    } catch (err) {
        console.log(err)
    }


}



async function sellTokenForBNB(amountIn, amountOutMin, tokenIn, tokenOut, recipient, gasLimit, gas){
    const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [tokenIn, tokenOut],
        recipient,
        Date.now() + 1000 * 60 * 10, //10 minutes
        {
            gasLimit: gasLimit,
            gasPrice: ethers.utils.parseUnits(gas.toString(), "gwei")
        }
    )
    const receipt = await tx.wait();
    return receipt
}
async function approveToken(helper, tokenToApprove, approveValue, gasLimit, typeOfSwap, gas){
    try{
        if(typeOfSwap === "sell"){
            tokenToApprove = addresses.router
        }
        await helper.approve(tokenToApprove, approveValue, {
            //gasLimit: gasLimit,
            gasPrice: ethers.utils.parseUnits(gas.toString(), "gwei")
        })
    }catch(err){
        console.log('approve failed with error : ', err)
    }

}

async function buyTokenWithBNB(amountIn, amountOutMin, tokenIn, tokenOut, recipient, gasLimit, gas){
    const tx = await router.swapExactETHForTokens(
        0,
        [tokenIn, tokenOut],
        recipient,
        Date.now() + 1000 * 60 * 10, //10 minutes
        {
            value: amountIn,
            gasLimit: gasLimit,
            gasPrice: ethers.utils.parseUnits(gas.toString(), "gwei")
        }
    )
    const receipt = await tx.wait();
    return receipt
}

function etherValue(value){
    value = ethers.utils.parseUnits(value.toString(), "ether")
    value = ethers.BigNumber.from(value)
    return value
}





//song
//swapTokens("0x9379317E46Fd439d9d985680776476D806AF6C57", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100, 15)
//swapTokens("0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100, 25)



//0xe87b3d2b452f8d3534a552a9979cc9c568dbd93d monkey

//swapTokens("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0xe87b3d2b452f8d3534a552a9979cc9c568dbd93d", 0.04, 5) //dans le cas où on achète 0.01 = 0.01 bnb par exemple
//swapTokens("0xe87b3d2b452f8d3534a552a9979cc9c568dbd93d", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100, 15) //dans le cas où on achète 0.01 = 0.01 bnb par exemple

//0xc9d5b07975d4c8636d68bd71c3deec16489c9ff4 elon
//swapTokens("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0xc9d5b07975d4c8636d68bd71c3deec16489c9ff4", 0.05, 25)
//swapTokens("0xc9d5b07975d4c8636d68bd71c3deec16489c9ff4", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100, 25)


//swapTokens("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x812d6b8c560d6bf6c558b0bf8ee9c39c6ea2612f", 0.02) //dans le cas où on achète 0.01 = 0.01 bnb par exemple
//swapTokens("0xc1be1458f06faf99027853309e06e2c38997f25d", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100)
//mainnet here
//0x5e90253fbae4dab78aa351f4e6fed08a64ab5590 bonfire
//0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c WBNB

//0xe9e7cea3dedca5984780bafc599bd69add087d56 BUSD


//testnet here
//0x30ca5bd5bc98bbb703c3005000801a97f91b0697 test

//0xae13d989dac2f0debff460ac112a837c89baa7cd WBNB
//0xf89bfaefcea6062e37e536a243669d1b028b9fc7 BUSDold
//0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee BUSD new