const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: String, required: true },
    measurement: { type: String, required: false },
    calories: { type: Number, required: true },
});
const Ingredient = mongoose.model('ingredients', ingredientSchema);

module.exports = Ingredient;