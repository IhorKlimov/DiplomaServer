const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'users', required: true },
    followingUserId: { type: ObjectId, ref: 'users', required: true },
});
subscriptionSchema.index({ userId: 1, followingUserId: 1 }, { unique: true })
const Subscription = mongoose.model('subscriptions', subscriptionSchema);

module.exports = Subscription;