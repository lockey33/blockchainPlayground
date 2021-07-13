
// Import modules
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// Set up Image schema

let snipeSchema = Schema({
    id: String,
    buyerAddress: String,
    storage: Object,
    snipes: Array,
    insertedAtDate: String
});

export default snipeSchema = mongoose.model('snipe', snipeSchema);