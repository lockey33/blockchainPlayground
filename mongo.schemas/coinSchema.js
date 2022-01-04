
// Import modules
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// Set up Image schema

let coinSc
// Import modules
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// Set up Image schema

let coinSchema = Schema({
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
export default coinSchema = mongoose.model('coin', coinSchema);hema = Schema({
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
export default coinSchema = mongoose.model('coin', coinSchema);