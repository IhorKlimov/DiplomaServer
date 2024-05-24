const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    ingredients: { type: String, required: true },
    description: { type: String, required: true },
    categories: { type: [{ type: ObjectId, ref: 'categories', }], required: true, },
    cookingMethods: { type: [{ type: ObjectId, ref: 'cookingmethods', }], required: true, },
    specialDiets: { type: [{ type: ObjectId, ref: 'specialdiets', }], required: false, },
    difficulty: { type: ObjectId, ref: 'difficulties', required: true, },
    authorId: { type: String, required: true },
    rating: { type: Number, required: false, },
    caloriesPerServing: { type: Number, required: false, },
    servings: { type: Number, required: false, },
    createdTimestamp: { type: Number, required: true },
    updatedTimestamp: { type: Number, required: false },
});
recipeSchema.index({ title: 'text', description: 'text', ingredients: 'text' });
const Recipe = mongoose.model('recipes', recipeSchema);

module.exports = Recipe;