const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    categories: { type: [{ type: ObjectId, ref: 'categories', }], required: true, },
    authorId: { type: String, required: true }
});
const Recipe = mongoose.model('recipes', recipeSchema);

module.exports = Recipe;