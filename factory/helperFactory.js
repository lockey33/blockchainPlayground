import ethers from 'ethers'
import {CurrencyAmount, TokenAmount, JSBI, Token} from "./pancakeswap-sdk-v2/dist/index.js";
import axios from "axios";

export default class HelperFactory {

    constructor(config) {
        this.config = config
    }

    truncate = (fullStr, strLen, separator) => {
        if (fullStr.length <= strLen) return fullStr;

        separator = separator || '...';

        let sepLen = separator.length,
            charsToShow = strLen - sepLen,
            frontChars = Math.ceil(charsToShow/2),
            backChars = Math.floor(charsToShow/2);

        return fullStr.substr(0, frontChars) +
            separator +
            fullStr.substr(fullStr.length - backChars);
    }

    async parseAmount(value, currency, tokenContractInstance, decimals){
        const typedValueParsed = ethers.utils.parseUnits(value, decimals).toString()
        if (typedValueParsed !== '0') {
            return currency instanceof Token
                ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
                : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
        }
    }

    async parseCurrency(value){
        const typedValueParsed = ethers.utils.parseUnits(value, 18).toString()
        if (typedValueParsed !== '0') {
            return new CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
        }
    }

    async parseToken(value, tokenInstance, tokenContractInstance, decimals){
        const typedValueParsed = ethers.utils.parseUnits(value, decimals).toString()
        if (typedValueParsed !== '0') {
            return new TokenAmount(tokenInstance, JSBI.BigInt(typedValueParsed))
        }
        return 0
    }



    async getKccUsdPrice(){
        const response = await axios.get("https://explorer.kcc.io/api/chainstat/kcs")
        this.config.priceUsd = response.data.data.priceUsd
        return response.data.data.priceUsd
    }

    readableValue(value, decimals){
        let customValue = value / Math.pow(10, decimals)
        return customValue.toFixed(6) // attention j'ai modifier ici, avant c'etait 4
    }

    toDecimals(value, decimalsOfToken){
        return value / Math.pow(10, decimalsOfToken)
    }

    async formatAmount(parsedAmount){
        if(parsedAmount === 0){
            console.log("Le token n'est pas encore dans mon portefeuille")
            return 0
        }
        if(parsedAmount instanceof CurrencyAmount){
            return parsedAmount.toExact()
        }else{
            return parsedAmount.toSignificant(6)
        }
    }

    calculateIncrease(originalAmount, newAmount){
        //console.log(originalAmount + '-' + newAmount)
        let increase = originalAmount - newAmount   // 100 - 70 = 30
        //console.log(newAmount , originalAmount)
        increase = increase / originalAmount  //  30/ 70
        increase = increase * 100
        increase = Math.round(increase)
        return increase
    }

    async checkSum(address){
        return ethers.utils.getAddress(address)
    }

}
