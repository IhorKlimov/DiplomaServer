const { ObjectId } = require("mongodb");
const session = require("../common/session");
const FavoriteRecipe = require('../model/favorite-recipe');
const Recipe = require('../model/recipe');

module.exports = function (app) {

    app.get('/favorite-recipe-ids', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            const result = await FavoriteRecipe.find({ userId: userId });
            const list = result.map((e) => e.recipeId);
            res.send(list);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/favorite-recipes', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            const result = await FavoriteRecipe.find({ userId: userId });
            const ids = result.map((e) => new ObjectId(e.recipeId));

            const data = await Recipe.aggregate(
                [
                    { "$match": { "_id": { "$in": ids } } },
                    {
                        "$lookup": {
                            "let": { "authorObjectId": { "$toObjectId": "$authorId" } },
                            "from": "users",
                            "pipeline": [
                                { "$match": { "$expr": { "$eq": ["$_id", "$$authorObjectId"] } } },
                            ],
                            "as": "author"
                        }
                    },
                    { "$unwind": { path: "$author" } }
                ]).exec();

            res.send(data);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/favorite-recipe-status', async (req, res) => {
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
                res.send({ isFavorite: false });
            } else {
                const fr = FavoriteRecipe({
                    userId: userId,
                    recipeId: recipeId,
                });

                const result = await fr.save();
                res.send({ isFavorite: true });
            }
        } catch (e) {
            res.status(500).send(e.message);
        }
    });
}