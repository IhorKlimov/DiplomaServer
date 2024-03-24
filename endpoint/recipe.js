const Recipe = require('../model/recipe');
const { ObjectId } = require('mongodb');
const session = require('../common/session');

module.exports = function (app) {
    app.get('/recipes', async (req, res) => {
        let userId = req.query.userId;
        const showMyRecipes = req.query.showMyRecipes;

        const pipelines = [
            { "$match": { "$expr": { "$eq": ["$_id", "$$authorObjectId"] } } },
        ];

        if (showMyRecipes === 'true') {
            userId = session.getUserId(req.get('session'));
            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }
        }

        if (userId) {
            pipelines.push({
                "$match": { "$expr": { "$eq": ["$_id", new ObjectId(userId)] } }
            });
        }

        try {
            const data = await Recipe.aggregate(
                [
                    {
                        "$lookup": {
                            "let": { "authorObjectId": { "$toObjectId": "$authorId" } },
                            "from": "users",
                            "pipeline": pipelines,
                            "as": "author"
                        }
                    },
                    { "$unwind": { path: "$author" } }
                ]).exec();
            res.send(data);
        } catch (e) {
            res.send(e);
        } finally {
            // await client.close();
        }
    })

    app.get('/recipe', async (req, res) => {
        const id = req.query.id;
        const verifyAuthor = req.query.verifyAuthor;
        const userId = session.getUserId(req.get('session'));

        if (!id) {
            res.send("Missing attributes");
            return;
        }

        if (verifyAuthor === 'true' && !userId) {
            res.status(401).send('Unauthorized. Missing user id');
            return;
        }

        try {
            const data = await Recipe.aggregate(
                [
                    { $match: { $expr: { $eq: ['$_id', { $toObjectId: id }] } } },
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
                ]);
            const recipe = data[0];
            if (recipe == null) {
                res.status(404).send('Recipe not found');
                return;
            }
            if (verifyAuthor === 'true' && recipe.authorId != userId) {
                res.status(401).send('Unauthorized. This recipe does not belog to this user');
                return;
            }

            res.send(recipe);
        } catch (e) {
            res.status(500).send(e.message);
        } finally {
            // await client.close();
        }
    })

    app.post('/recipe', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            const recipe = Recipe({
                title: req.body.title,
                imageUrl: req.body.imageUrl,
                description: req.body.text,
                authorId: userId,
            });
            const model = await recipe.save();
            res.send({ recipeId: model._id, });
        } catch (e) {
            res.status(400).send(e.message);
        } finally {
            // await client.close();
        }
    });

    app.put('/recipe', async (req, res) => {
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

            const recipe = await Recipe.findById(recipeId);
            if (recipe.authorId != userId) {
                res.status(401).send('Unauthorized. This recipe does not belog to this user');
                return;
            }

            await Recipe.findByIdAndUpdate(recipeId, {
                title: req.body.title,
                imageUrl: req.body.imageUrl,
                description: req.body.text,
                categories: req.body.categories,
            });

            res.send({ status: 'Saved changes' });
        } catch (e) {
            res.status(400).send(e.message);
        } finally {
            // await client.close();
        }
    });

    app.delete('/recipe', async (req, res) => {
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

            const recipe = await Recipe.findById(recipeId);
            if (recipe.authorId != userId) {
                res.status(401).send('Unauthorized. This recipe does not belog to this user');
                return;
            }

            await Recipe.findByIdAndDelete(recipeId);

            res.send({ status: 'Deleted recipe' });
        } catch (e) {
            res.status(400).send(e.message);
        } finally {
            // await client.close();
        }
    })

}