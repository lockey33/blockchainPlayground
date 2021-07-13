import GlobalFactory from "./factory/globalFactory.js";
import ethers from "ethers";
import ERC20 from "./factory/abis/erc20.js";

(async () => {
    const factory =  new GlobalFactory("prod", "cash", "kcc");
    await factory.init()
    await factory.scheduleFactory.getKccUsdPrice()
    const targetToken = "0x980a5afef3d17ad98635f6c5aebcbaeded3c3430"
    const WBNB = factory.config.WBNB;
    const tokenIn = WBNB;
    const balanceTokenIn = ethers.utils.parseUnits("7.000000", "ether");
    console.log(balanceTokenIn.toString())
    let amountIn = await factory.helper.parseCurrency(balanceTokenIn.toString())
    amountIn = amountIn.toExact()
    console.log(amountIn)

    const targetTokenContractInstance =  await factory.contractManager.getFreeContractInstance(targetToken, ERC20)
    const targetTokenDecimals = await factory.contractManager.callContractMethod(targetTokenContractInstance, "decimals")
    console.log(targetTokenDecimals)
    let totalSupply = await factory.contractManager.callContractMethod(targetTokenContractInstance, "totalSupply")
    console.log(totalSupply)

    let options = {balanceTokenIn: amountIn, tokenIn: tokenIn, tokenOut: targetToken} // j'ai interverti ici pour avoir un pourcentage cohérent voir commentaire dans createIntervalForCoin

    console.log(options)
    const priceOfToken = await factory.contractManager.callContractMethod(factory.contractManager.contracts.routerPaidContractInstance, "getAmountsOut", options)

    console.log(priceOfToken)

})()

