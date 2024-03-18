const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    authorId: { type: String, required: true }
});
const Recipe = mongoose.model('recipes', recipeSchema);

module.exports = Recipe;