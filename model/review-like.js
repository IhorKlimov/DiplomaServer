const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const reviewLikeSchema = new mongoose.Schema({
    reviewId: { type: ObjectId, required: true },
    userId: { type: ObjectId, required: true },
});
reviewLikeSchema.index({ reviewId: 1, userId: 1 }, { unique: true })
const ReviewLike = mongoose.model('reviewlikes', reviewLikeSchema);

module.exports = ReviewLike;