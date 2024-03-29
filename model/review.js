const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    stars: { type: Number, required: false },
    text: { type: String, required: true },
    userId: { type: String, required: true },
    recipeId: { type: String, required: true },
    createdTimestamp: { type: Number, required: true },
    updatedTimestamp: { type: Number, required: false },
});
const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;