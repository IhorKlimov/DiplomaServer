const session = require("../common/session");
const FavoriteRecipe = require('../model/favorite-recipe');
const user = require("./user");

module.exports = function (app) {

    app.get('/favorite-recipes', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            const result = await FavoriteRecipe.find({ userId: userId });
            const list = result.map((e) => e.recipeId);
            console.log(list);
            res.send(list);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/favorite-recipe', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const recipeId = req.query.recipeId;

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            if (!recipeId) {
                res.status(400).send('Missing attributes');
                return;
            }
            const existing = await FavoriteRecipe.find({
                userId, recipeId,
            });

            res.send({ isFavorite: existing.length > 0 });
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.post('/favorite-recipe', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const recipeId = req.body.recipeId;

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }
            if (!recipeId) {
                res.status(400).send('Missing attributes');
                return;
            }
            const existing = await FavoriteRecipe.find({
                userId, recipeId,
            });

            if (existing.length > 0) {
                await FavoriteRecipe.findOneAndDelete({
                    userId, recipeId,
                });
                res.send({ status: 'Removed from favorites' });
            } else {
                const fr = FavoriteRecipe({
                    userId: userId,
                    recipeId: recipeId,
                });

                const result = await fr.save();
                res.send({ status: 'Saved to favorites' });
            }
        } catch (e) {
            res.status(500).send(e.message);
        }
    });
}