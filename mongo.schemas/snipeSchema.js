
// Import modules
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// Set up Image schema

let snipeSchema = Schema({
    id: String,
    buyerAddress: String,
    premium: Boolean,
    truncBuyerAddress: String,
    paymentWallet: Object,
    snipeWallets: Array,
    snipes: Array,
    insertedAtDate: String
});

export default snipeSchema = mongoose.model('snipe', snipeSchema);