
// Import modules
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// Set up Image schema

let tokenSchema = Schema({
    id: String,
    contract: String,
    marketCap: String,
    insertedAtDate: String
});

// Export Image model
export default tokenSchema = mongoose.model('tokens', tokenSchema);