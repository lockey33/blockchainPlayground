import GlobalFactory from "./factory/globalFactory.js";
import myAccounts from "./static/projectMode/prod/accounts.js";
import ethers from "ethers";
import PANCAKE from "./factory/abis/pancake.js";
import ERC20 from "./factory/abis/erc20.js";

(async () => {
    const factory =  new GlobalFactory("prod", myAccounts.account1);
    await factory.scheduleFactory.refreshTokensData()
    const WBNB = factory.config.WBNB;
    const tokenIn = WBNB;
    const targetToken = "0x99c349d3bcf2a283722113f36db7e374d45d8c54";
    const balanceTokenIn = ethers.utils.parseUnits("1", "ether");
    const routerContractInstance = await factory.contractManager.getPaidContractInstance(factory.config.router, PANCAKE, factory.config.signer)

    const targetTokenContractInstance =  await factory.contractManager.getFreeContractInstance(targetToken, ERC20)
    const targetTokenDecimals = await factory.contractManager.callContractMethod(targetTokenContractInstance, "decimals")

    const options = {balanceTokenIn: balanceTokenIn, tokenIn: tokenIn, tokenOut: targetToken} // j'ai interverti ici pour avoir un pourcentage cohérent voir commentaire dans createIntervalForCoin

    const priceOfToken = await factory.contractManager.callContractMethod(routerContractInstance, "getAmountsOut", options)
    let priceOut = await factory.helper.readableValue(priceOfToken[1], targetTokenDecimals)
    priceOut = Math.trunc(priceOut)
    console.log("priceOut", priceOut)

    const BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56";
    const optionsBUSD = {balanceTokenIn: balanceTokenIn, tokenIn: WBNB, tokenOut: BUSD}
    const priceOfTokenInBUSD = await factory.contractManager.callContractMethod(routerContractInstance, "getAmountsOut", optionsBUSD)
    const BUSDContract = await factory.contractManager.getFreeContractInstance(BUSD, ERC20)
    const BUSDDecimals = await factory.contractManager.callContractMethod(BUSDContract, "decimals")
    let priceOutInBUSD = await factory.helper.readableValue(priceOfTokenInBUSD[1], BUSDDecimals)
    console.log('busd decimals', BUSDDecimals)
    console.log('targetDecimals', targetTokenDecimals)
    priceOutInBUSD = Math.trunc(priceOutInBUSD)
    console.log("priceOutInBUSD", priceOutInBUSD, "priceOut", priceOut)

    let priceOfOneTargetToken = (priceOutInBUSD/priceOut).toFixed(30)

    console.log("priceOfOneToken",priceOfOneTargetToken)


    let totalSupply = await factory.contractManager.callContractMethod(targetTokenContractInstance, "totalSupply")
    totalSupply = await factory.helper.toDecimals(totalSupply, targetTokenDecimals)
    console.log("totalSupply", totalSupply)
    let marketCap = priceOfOneTargetToken.toString() * totalSupply
    console.log(marketCap)
})()

