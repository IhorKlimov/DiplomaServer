const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const accountDetailsSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'users', required: true },
    password: { type: String, required: true },
});
const AccountDetails = mongoose.model('accountdetails', accountDetailsSchema);

module.exports = AccountDetails;