import tokenSchema from '../mongo.schemas/tokenSchema.js'
import { Agenda } from 'agenda/es.js';
import ERC20 from "./abis/erc20.js";
import PANCAKE from "./abis/pancake.js";
import moment from "moment";
import axios from "axios";
const mongoConnectionString = "mongodb://localhost:27017/frontMoney"


export default class scheduleFactory {

    constructor(config, dbFactory, contractManager, listener, helper){
        this.tokenSchema = tokenSchema
        this.config = config
        this.dbFactory = dbFactory
        this.contractManager = contractManager
        this.listener = listener
        this.helper = helper
        this.agenda = new Agenda({ db: { address: mongoConnectionString, collection: "agendaJobs", maxConcurrency: 20, defaultConcurrency: 5 } })

    }



    async retryFailedJobs(){
        const failedJobs = await this.agenda.jobs({'failReason': {$exists: true}})
        console.log(failedJobs)
    }

    async stopAllJobs(filters= {}){
        console.log('stopping all jobs')
        await this.agenda.cancel(filters)
        return true
    }

    async runAllJobs(){
        const jobs = await this.agenda.jobs()
        await Promise.all(
            jobs.map(async (job) => {
                await this.agenda.run(job)
                console.log('job runned')
            })
        )
    }

    async listenJobAuto(){
        await this.agenda.start()
        const jobName = "listenTokensAuto"
        await this.stopAllJobs()
        await this.runAllJobs()

        try{
            await this.agenda.define(jobName, { lockLifetime: 10000 }, async (job, done) => {
                console.log('auto listen new token')

                const tokens = await this.dbFactory.getTokensFiltered({})
                await Promise.all(
                    tokens.map(async (token) => {
                        await this.listenPrice(this.config.WBNB, token.contract, 4000)
                    })
                )
                done()
            })
            await this.agenda.every("10 seconds", jobName);
        }catch(err){
            console.log(err)
        }
    }

    async listenPrice(tokenIn, tokenOut, timer){
        const tokenInContractInstance =  await this.contractManager.getFreeContractInstance(tokenIn, ERC20)
        const tokenOutContractInstance =  await this.contractManager.getFreeContractInstance(tokenOut, ERC20)
        const tokenInDecimals = await this.contractManager.callContractMethod(tokenInContractInstance, "decimals")
        const tokenOutDecimals = await this.contractManager.callContractMethod(tokenOutContractInstance, "decimals")

        let balanceTokenIn = await this.contractManager.callContractMethod(tokenInContractInstance, "balanceOf")
        //console.log(this.helper.readableValue(balanceTokenIn.toString(), tokenInDecimals))
        let amounts = await this.contractManager.checkLiquidity( balanceTokenIn, tokenIn, tokenOut) // pour 1 bnb, combien
        let initialAmountIn = this.helper.readableValue(amounts[0].toString(), tokenInDecimals)
        let initialAmountOut = this.helper.readableValue(amounts[1].toString(), tokenOutDecimals) //
        //console.log('initialAmountIn :',initialAmountIn)
        //console.log('initialAmountOut :',initialAmountOut)
        if(amounts !== false){
            const interval = await this.priceInterval(balanceTokenIn,tokenIn, tokenOut, initialAmountIn, initialAmountOut,tokenOutDecimals)
            return interval
        }
    }


    async priceInterval(balanceTokenIn, tokenIn, tokenOut, initialAmountIn, initialAmountOut, tokenOutDecimals){
        const jobName = "listenToken_" + tokenOut
        await this.agenda.define(jobName, async (job, done) => {
            let amounts = await this.contractManager.checkLiquidity( balanceTokenIn, tokenIn, tokenOut)
            if(amounts === false){
                console.log('HERRREEEEE')
                return false
            }
            let actualAmountOut = this.helper.readableValue(amounts[1].toString(), tokenOutDecimals)
            let pourcentageFluctuation = this.helper.calculateIncrease(initialAmountOut,actualAmountOut)
            //console.log('----------------')
            //console.log('\x1b[36m%s\x1b[0m', "increasePourcentage : "+ pourcentageFluctuation + "% " + tokenOut);
            let actualDateAndHour = moment().format("DD/MM/YYYY HH:mm:ss")
            //socket.emit("listenToken", {contract: tokenOut, fluctuation: pourcentageFluctuation, date: actualDateAndHour})
            try{
                let fluctuationObject = {}
                fluctuationObject = {...fluctuationObject, date: actualDateAndHour, pourcentage: pourcentageFluctuation}
                if(pourcentageFluctuation !== 0){
                    await this.dbFactory.tokenSchema.findOneAndUpdate({"contract": tokenOut}, {$push: {fluctuation: fluctuationObject}, $set: {listening: true}})
                }
            }catch(err){
                console.log(err)
            }
            //console.log('----------------')
            done()
        })
        await this.agenda.every("4 seconds", jobName);
    }


    async refreshTokensData(){
        await this.agenda.start()
        await this.retryFailedJobs()
        const jobName = "refreshTokensData"
        await this.agenda.define(jobName, { lockLifetime: 10000 }, async (job, done) => {
            try{

            const tokensListening = await this.dbFactory.getTokensFiltered({})
            if(tokensListening.length > 0 ){
/*                job.fail(new Error("insufficient disk space"));
                return await job.save();*/
                console.log("refresh")
                await Promise.all(
                    tokensListening.map(async (token) => {
                        const targetTokenContractInstance = await this.contractManager.getFreeContractInstance(token.contract, ERC20)
                        const targetTokenDecimals = await this.contractManager.callContractMethod(targetTokenContractInstance, "decimals")
                        let marketCapObject = {marketCap: null, tokenPrice: null}
                        marketCapObject = await this.contractManager.calculateMarketCap(token.contract, targetTokenContractInstance, targetTokenDecimals)
                        try{
                            await this.dbFactory.tokenSchema.updateOne({contract: token.contract}, {$set: {marketCap: marketCapObject.marketCap, price: marketCapObject.tokenPrice}})
                        }catch(err){
                            console.log(err)
                        }
                    })
                )
            }
            done()
            }
            catch(err){
                console.log(err)
            }
        })

        await this.agenda.every("10 seconds", jobName);
    }

}
