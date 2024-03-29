const mongoose = require('mongoose');

const cookingMethodSchema = new mongoose.Schema({
    name: { type: String, required: true },
});
const CookingMethod = mongoose.model('cookingmethods', cookingMethodSchema);

module.exports = CookingMethod;