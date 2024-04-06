const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const cookingTimeSchema = new mongoose.Schema({
    recipeId: { type: ObjectId, ref: 'recipes', required: true, unique: true, },
    prep: { type: Number, required: true },
    cooking: { type: Number, required: true },
    total: { type: Number, required: true },
});
const CookingTime = mongoose.model('cookingtimes', cookingTimeSchema);

module.exports = CookingTime;