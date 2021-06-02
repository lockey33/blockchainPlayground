

async function test(){
    let balance = await provider.getBlockNumber()
    console.log(balance)

    return balance

}


module.exports = {
    test: test,
}