const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    categories: { type: [{ type: ObjectId, ref: 'categories', }], required: true, },
    authorId: { type: String, required: true },
    createdTimestamp: { type: Number, required: true },
    updatedTimestamp: { type: Number, required: false },
});
recipeSchema.index({ title: 'text', description: 'text' });
const Recipe = mongoose.model('recipes', recipeSchema);

module.exports = Recipe;