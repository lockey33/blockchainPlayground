const ethers = require("ethers");
const Web3 = require('web3');
const pancakeAbi = require('./abi/pancake.json');
const wbnbAbi = require('./abi/wbnb.json');
const helperAbi = require('./abi/helper.json');
const approveSpenderAbi = require('./abi/approveSpender.json');

const mainNet = "https://bsc-mainnet.web3api.com/v1/YG5ZXZX9AX6TA9NZAEX71SR8FAAFYPSCVX";
const mainNetBlockIo = "https://bsc.getblock.io/mainnet/?api_key=811a98b6-09f6-4fc8-a7f8-71112672ab97";


/*const { TelegramClient } = require('telegram')
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
})()*/

const addresses = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', //prod
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', //prod
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //prod
    recipient: '0x145239daBd91E2F3AD3D3A00C654c8FDa7bA5Fcc' //prod
    //recipient: '0xd19FC8336cC95e7A2cc3f859214D8e2A6467F9E9' //prod node
}
const privateKey = "ba65fb51edf8aa3e97a3beea9fdde2786a3acad63c4714da1b30313f53d99c96"; //prod

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


async function swapTokens(tokenIn, tokenOut, amount, gas, needToApprove = false) { //exchange token1 for token2


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

        console.log(gas)
        if(needToApprove === true){
            await approveToken(contractTokenIn, tokenIn, approveMaxValue, gasLimit, typeOfSwap, gas)
            console.log('approved')
            await sleep(3000)
        }


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
        if(typeOfSwap === "buy"){
            return tokenOutBalance
        }else{
            return tokenInBalance
        }
    } catch (err) {
        console.log(err)
    }


}

async function approveToken(helper, tokenToApprove, approveValue, gasLimit, typeOfSwap, gas){
    try{
        if(typeOfSwap === "sell"){
            tokenToApprove = addresses.router
        }
        const approveTx = await helper.approve(tokenToApprove, approveValue, {
            //gasLimit: gasLimit,
            gasPrice: ethers.utils.parseUnits(gas.toString(), "gwei")
        })
        console.log(approveTx)
        const receptApprove = await approveTx.wait()
        console.log(receptApprove)
        return receptApprove
    }catch(err){
        console.log('approve failed with error : ', err)
    }

}

async function justApprove(tokenIn, tokenOut, amount, gas) { //exchange token1 for token2
    try {
        let typeOfSwap = "buy"
        let contractTokenIn = new ethers.Contract(tokenIn, wbnbAbi, account)
        let contractTokenOut = new ethers.Contract(tokenOut, helperAbi, account)
        if(tokenIn !== addresses.WBNB){
            typeOfSwap = "sell"
            contractTokenIn = new ethers.Contract(tokenIn, approveSpenderAbi, account)
            contractTokenOut = new ethers.Contract(tokenOut, wbnbAbi, account)
        }
        //balance of tokens
        let block = await web3.eth.getBlock("latest");
        let gasLimit = block.gasLimit / block.transactions.length
        gasLimit = Math.trunc(gasLimit)
        gasLimit = gasLimit * 1.5
        gasLimit = gasLimit.toString()
        await approveToken(contractTokenIn, tokenIn, approveMaxValue, gasLimit, typeOfSwap, gas)
        console.log('approved')
    } catch (err) {
        console.log(err)
    }


}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function sellTokenForBNB(amountIn, amountOutMin, tokenIn, tokenOut, recipient, gasLimit, gas){
    console.log('sell')
    console.log('gasLimit', gasLimit)

    const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn,
        amountOutMin,
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



async function buyTokenWithBNB(amountIn, amountOutMin, tokenIn, tokenOut, recipient, gasLimit, gas){
    console.log('buy')
    console.log('gasLimit', gasLimit)
    const tx = await router.swapExactETHForTokens(
        amountOutMin,
        [tokenIn, tokenOut],
        recipient,
        Date.now() + 1000 * 60 * 10, //10 minutes
        {
            value: amountIn,
            gasLimit: gasLimit,
            gasPrice: ethers.utils.parseUnits(gas.toString(), "gwei")
        }
    )
    console.log('bim', tx)
    const receipt = await tx.wait();
    return receipt
}


//swapTokens("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x812d6b8c560d6bf6c558b0bf8ee9c39c6ea2612f", 0.02) //dans le cas où on achète 0.01 = 0.01 bnb par exemple
//swapTokens("0xc1be1458f06faf99027853309e06e2c38997f25d", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100)


function readableNumber(number){
    number = number / Math.pow(10, 18)
    return number.toFixed(4)
}

async function buyAndGoWithProfit(tokenIn, tokenOut, buyAmount, pourcentage, sellingPourcentageAmount, gas, needToApprove) {
    let holdedTokenAmount = await swapTokens(tokenIn, tokenOut, buyAmount, gas)
    console.log('holded tokens ', readableNumber(holdedTokenAmount))
    let amounts = null
    let waitProfit = setInterval(async function(){
        amounts = await router.getAmountsOut(holdedTokenAmount, [tokenIn, tokenOut]);
        let readableAmountIn = readableNumber(amounts[0])
        let readableAmountOut = readableNumber(amounts[1])
        let increasePourcentage = calculateIncrease(readableAmountIn, readableAmountOut)
        console.log('amountIn : ', readableAmountIn)
        console.log('amountOut :', readableAmountOut)
        console.log('increasePourcentage : ', increasePourcentage , "%")
        if(increasePourcentage >= pourcentage){
            console.log("Le pourcentage de gain a la vente est de", increasePourcentage, "% envoi de l'ordre d'achat en cours")
            clearInterval(waitProfit)
            await swapTokens(tokenOut, tokenIn , sellingPourcentageAmount, gas, needToApprove)
            return console.log("Vendu avec profit")
        }
    }, 1000);


}

/*async function checkHoneyPot(tokenIn, tokenOut){
    let amounts = null
    await swapTokens(tokenIn ,tokenOut, 0.001, 5)
    amounts = await router.getAmountsOut(tokenOut, [tokenIn, tokenOut]);
    await swapTokens(tokenOut, tokenIn , 100, 5)
}*/

function calculateIncrease(originalAmount, newAmount){
    let increase = newAmount - originalAmount
    increase = increase / originalAmount
    increase = increase * 100
    increase = Math.round(increase)
    return increase
}

async function waitProfit(tokenIn, tokenOut, pourcentage, gas, needToApprove){

    let contractTokenIn = new ethers.Contract(tokenIn, wbnbAbi, account)
    let balanceTokenIn = await contractTokenIn.balanceOf(addresses.recipient)
    let amounts = await router.getAmountsOut(balanceTokenIn, [tokenIn, tokenOut]);
    let initialAmountIn = readableNumber(amounts[0])
    let initialAmountOut = readableNumber(amounts[1])
    console.log('initial out : ', initialAmountOut)
    let waitProfit = setInterval(async function(){
        amounts = await router.getAmountsOut(balanceTokenIn, [tokenIn, tokenOut]);
        let actualAmountIn = readableNumber(amounts[0])
        let actualAmountOut = readableNumber(amounts[1])
        let increasePourcentage = calculateIncrease(initialAmountOut, actualAmountOut)
        console.log('amountIn : ', actualAmountIn)
        console.log('amountOut :', actualAmountOut)
        console.log('increasePourcentage : ', increasePourcentage , "%")
        if(increasePourcentage >= pourcentage){
            console.log("Le pourcentage de gain a la vente est de", increasePourcentage, "% envoi de l'ordre de vente en cours")
            clearInterval(waitProfit)
            await swapTokens(tokenOut, tokenIn , 100, gas, needToApprove)
            return console.log("Vendu avec profit")
        }

    }, 1000);

}


//buyAndGoWithProfit("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c","0xcaa1c9f4645745d81181b79cd0bddbf44b51efa6", 0.01, 100, 100, 5)

//waitProfit("0xc9d5b07975d4c8636d68bd71c3deec16489c9ff4", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", 100, 5)
//
async function waitDip(tokenIn, tokenOut, pourcentage){
    let contractTokenIn = new ethers.Contract(tokenIn, wbnbAbi, account)
    let balanceTokenIn = await contractTokenIn.balanceOf(addresses.recipient)
    let amounts = await router.getAmountsOut(balanceTokenIn, [tokenIn, tokenOut]);
    let initialAmountIn = readableNumber(amounts[0])
    let initialAmountOut = readableNumber(amounts[1])
    console.log('initial out : ', initialAmountOut)
    let waitDip = setInterval(async function(){
        amounts = await router.getAmountsOut(balanceTokenIn, [tokenIn, tokenOut]);
        let actualAmountIn = readableNumber(amounts[0])
        let actualAmountOut = readableNumber(amounts[1])
        let decreasePourcentage = calculateIncrease(initialAmountOut, actualAmountOut)
        console.log('amountIn : ', actualAmountIn)
        console.log('amountOut :', actualAmountOut)
        console.log('increasePourcentage : ', decreasePourcentage , "%")
        if(decreasePourcentage >= pourcentage){
            console.log("Le dip atteint" + decreasePourcentage +", achat direct")
            clearInterval(waitDip)
            return console.log("achat du dip en cours")
        }
    }, 1000);

}
function enterAtBestPrice(tokenIn, tokenOut, decreaseBeforeEnter, buyAmount, gas){
    waitDip(wbnb, customtoken, 50).then(() => {
        swapTokens(wbnb, customtoken, buyAmount, gas).then(() => {
            waitProfit(customtoken, wbnb, 100, gas)
        })
    })
}


let wbnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
let customtoken = "0x1a1052d1270e82bbad6702cfac9758a87ef2c769"
//enterAtBestPrice()
    //justApprove(customtoken, wbnb, 100, 5)

//waitProfit(customtoken, wbnb, 25, 10, true)
//swapTokens(customtoken,wbnb , 100, 5, true)
swapTokens(wbnb, customtoken, 0.1, 15, false).then(() => {
    waitProfit(customtoken, wbnb, 50, 25, false)
})
//mainnet here
//0x5e90253fbae4dab78aa351f4e6fed08a64ab5590 bonfire
//0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c WBNB

//0xe9e7cea3dedca5984780bafc599bd69add087d56 BUSD


