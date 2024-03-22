const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    stars: { type: Number, required: false },
    text: { type: String, required: true },
    userId: { type: String, required: true },
    recipeId: { type: String, required: true },
    timestamp: { type: Number, required: true },
});
const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;