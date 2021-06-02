"use strict";

async function test() {
    var balance = await provider.getBlockNumber();
    console.log(balance);

    return balance;
}

module.exports = {
    test: test
};