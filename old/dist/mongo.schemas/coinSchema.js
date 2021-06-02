'use strict';

// Import modules
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// Set up Image schema

var coinSchema = Schema({
    symbol: String,
    marketCap: Number,
    price: Number,
    name: String,
    logo: String,
    links: Array,
    launchDate: Number,
    shipTo: String,
    shipToName: String,
    graphData: Array,
    productTitle: String,
    promPCPriceStr: String,
    rating: String,
    id: String,
    contracts: Array,
    insertedAtDate: String,
    fresh: Number
});

// Export Image model
module.exports = mongoose.model('coin', coinSchema);