const Recipe = require('../model/recipe');
const { ObjectId } = require('mongodb');
const session = require('../common/session');

module.exports = function (app) {
    app.get('/recipes', async (req, res) => {
        let userId = req.query.userId;
        const query = req.query.query;
        const categories = req.query.categories;
        const difficulty = req.query.difficulty;
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

        const aggregates = [];
        if (query) {
            aggregates.push({
                "$match": {
                    "$or": [
                        { "title": { "$regex": `.*${query}.*`, "$options": 'i' }, },
                        { "description": { "$regex": `.*${query}.*`, "$options": 'i' }, }
                    ]
                }
            });
        }
        if (categories) {
            const c = categories.split(',').map(e => new ObjectId(e));
            aggregates.push({ "$match": { "categories": { "$in": c } }, });
        }
        if (difficulty) {
            aggregates.push({ "$match": { "difficulty": { "$eq": new ObjectId(difficulty) } }, });
        }

        aggregates.push(
            {
                "$lookup": {
                    "let": { "authorObjectId": { "$toObjectId": "$authorId" } },
                    "from": "users",
                    "pipeline": pipelines,
                    "as": "author"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "localField": "categories",
                    "foreignField": "_id",
                    "as": "categories",
                },
            },
            {
                "$lookup": {
                    "from": "difficulties",
                    "localField": "difficulty",
                    "foreignField": "_id",
                    "as": "difficulty",
                },
            },
            { "$unwind": { path: "$difficulty" } },
            { "$unwind": { path: "$author" } }
        );

        try {
            const data = await Recipe.aggregate(aggregates).exec();
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
                    {
                        "$lookup": {
                            "from": "categories",
                            "localField": "categories",
                            "foreignField": "_id",
                            "as": "categories",
                        },
                    },
                    {
                        "$lookup": {
                            "from": "difficulties",
                            "localField": "difficulty",
                            "foreignField": "_id",
                            "as": "difficulty",
                        },
                    },
                    { "$unwind": { path: "$difficulty" } },
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
                difficulty: req.body.difficulty,
                categories: req.body.categories,
                createdTimestamp: new Date().getTime(),
                updatedTimestamp: new Date().getTime(),
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
                difficulty: req.body.difficulty,
                updatedTimestamp: new Date().getTime(),
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