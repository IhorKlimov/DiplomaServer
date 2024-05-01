const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const accountDetailsSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'users', required: true, unique: true, },
    password: { type: String, required: false },
    provider: { type: String, required: false },
});
const AccountDetails = mongoose.model('accountdetails', accountDetailsSchema);

module.exports = AccountDetails;