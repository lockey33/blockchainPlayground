import ListenerFactory from "./factory/listenerFactory.js";

const listener = new ListenerFactory()

const options = {
    buyAmount: 0.05,
    multiplier: 8,
    frontRun: true,
    tradeForReal: false,
    wantedSlippage: -40,
    tokenToFind: false,
    amountBnbFrom: 0.05,
    amountBnbTo: 10

}

listener.listenToPendingTransactions(options)