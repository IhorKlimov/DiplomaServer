const mongoose = require('mongoose');

const favoriteRecipeSchema = new mongoose.Schema({
    userId: { type: String, required: true, },
    recipeId: { type: String, required: true, },
});
favoriteRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true })
const FavoriteRecipe = mongoose.model('favoriterecipes', favoriteRecipeSchema);

module.exports = FavoriteRecipe;