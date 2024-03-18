const mongoose = require('mongoose');

const favoriteRecipeSchema = new mongoose.Schema({
    userId: { type: String, required: true, },
    recipeId: { type: String, required: true, },
});
const FavoriteRecipe = mongoose.model('favoriteRecipes', favoriteRecipeSchema);

module.exports = FavoriteRecipe;