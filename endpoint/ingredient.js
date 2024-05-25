const Ingredient = require("../model/ingredient");

module.exports = function (app) {
    app.get('/ingredients', async (req, res) => {
        try {
            const ingredients = await Ingredient.distinct('name');

            res.send(ingredients);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}