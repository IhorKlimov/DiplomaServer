const Recipe = require('../model/recipe');
const { ObjectId } = require('mongodb');
const session = require('../common/session');
const SortOption = require('../model/sort-option');
const Ingredient = require('../model/ingredient');
const CookingTime = require('../model/cooking-time');
const Subscription = require('../model/subscription');
const NotificationController = require("../controller/notification");
const pageSize = 12;


module.exports = function (app) {
    app.get('/recipes', async (req, res) => {
        let userId = req.query.userId;
        const showMyRecipes = req.query.showMyRecipes;
        const fromMySubscriptionsOnly = req.query.fromMySubscriptionsOnly;
        const queryObject = {
            query: req.query.query,
            categories: req.query.categories,
            cookingMethods: req.query.cookingMethods,
            difficulty: req.query.difficulty,
            sortBy: req.query.sortBy,
            caloriesFrom: req.query.caloriesFrom,
            caloriesTo: req.query.caloriesTo,
            selectedDiets: req.query.selectedDiets,
            ratingFrom: req.query.ratingFrom,
            ratingTo: req.query.ratingTo,
            cookingTimeFrom: req.query.cookingTimeFrom,
            cookingTimeTo: req.query.cookingTimeTo,
        }
        const page = req.query.page;


        if (showMyRecipes === 'true') {
            userId = session.getUserId(req.get('session'));
            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }
        }
        let forUserIdSubscriptions = null;
        if (fromMySubscriptionsOnly === 'true') {
            forUserIdSubscriptions = session.getUserId(req.get('session'));
            if (!forUserIdSubscriptions) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }
        }

        const aggregates = await buildAggregate(userId, forUserIdSubscriptions, queryObject, page);

        try {
            const data = await Recipe.aggregate(aggregates).exec();
            res.send(data[0]);
        } catch (e) {
            res.send(e);
        } finally {
            // await client.close();
        }
    });

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
                            "from": "ingredients",
                            "localField": "ingredients",
                            "foreignField": "_id",
                            "as": "ingredients",
                        },
                    },
                    {
                        "$lookup": {
                            "from": "specialdiets",
                            "localField": "specialDiets",
                            "foreignField": "_id",
                            "as": "specialDiets",
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
                    {
                        "$lookup": {
                            "from": "cookingmethods",
                            "localField": "cookingMethods",
                            "foreignField": "_id",
                            "as": "cookingMethods",
                        },
                    },
                    {
                        "$lookup": {
                            "from": "cookingtimes",
                            "localField": "_id",
                            "foreignField": "recipeId",
                            "as": "cookingTime",
                        },
                    },
                    { "$unwind": { path: "$difficulty" } },
                    { "$unwind": { path: "$cookingTime" } },
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

            const ingredients = req.body.ingredients;
            const ingredientIds = [];

            for (let i in ingredients) {
                const ingredient = ingredients[i];

                const model = await Ingredient({
                    name: ingredient.name,
                    amount: ingredient.amount,
                    measurement: ingredient.measurement,
                    calories: ingredient.calories,
                }).save();

                ingredientIds.push(model._id);
            }

            const recipe = Recipe({
                title: req.body.title,
                imageUrl: req.body.imageUrl,
                description: req.body.text,
                ingredients: ingredientIds,
                authorId: userId,
                difficulty: req.body.difficulty,
                categories: req.body.categories,
                cookingMethods: req.body.cookingMethods,
                specialDiets: req.body.specialDiets,
                caloriesPerServing: req.body.caloriesPerServing,
                servings: req.body.servings,
                createdTimestamp: new Date().getTime(),
                updatedTimestamp: new Date().getTime(),
            });
            const model = await recipe.save();

            const cookingTime = CookingTime({
                recipeId: model._id,
                prep: req.body.prep,
                cooking: req.body.cooking,
                total: req.body.prep + req.body.cooking,
            });
            await cookingTime.save();
            await NotificationController.createNotificationForRecipe(userId, model._id);

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

            for (let i in recipe.ingredients) {
                await Ingredient.findByIdAndDelete(recipe.ingredients[i]);
            }
            const ingredients = req.body.ingredients;
            const ingredientIds = [];

            for (let i in ingredients) {
                const ingredient = ingredients[i];

                const model = await Ingredient({
                    name: ingredient.name,
                    amount: ingredient.amount,
                    measurement: ingredient.measurement,
                    calories: ingredient.calories,
                }).save();

                ingredientIds.push(model._id);
            }
            
            await Recipe.findByIdAndUpdate(recipeId, {
                title: req.body.title,
                imageUrl: req.body.imageUrl,
                description: req.body.text,
                ingredients: ingredientIds,
                categories: req.body.categories,
                specialDiets: req.body.specialDiets,
                servings: req.body.servings,
                caloriesPerServing: req.body.caloriesPerServing,
                cookingMethods: req.body.cookingMethods,
                difficulty: req.body.difficulty,
                updatedTimestamp: new Date().getTime(),
            });
            await CookingTime.findOneAndUpdate({ recipeId }, {
                prep: req.body.prep,
                cooking: req.body.cooking,
                total: req.body.prep + req.body.cooking,
            }, {
                upsert: true,
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

            for (let i in recipe.ingredients) {
                await Ingredient.findByIdAndDelete(recipe.ingredients[i]);
            }
            await Recipe.findByIdAndDelete(recipeId);
            await CookingTime.findOneAndDelete({ recipeId });


            res.send({ status: 'Deleted recipe' });
        } catch (e) {
            res.status(400).send(e.message);
        } finally {
            // await client.close();
        }
    })

}

async function buildAggregate(userId, forUserIdSubscriptions, queryObject, page) {
    const pipelines = [
        { "$match": { "$expr": { "$eq": ["$_id", "$$authorObjectId"] } } },
    ];

    if (userId) {
        pipelines.push({
            "$match": { "$expr": { "$eq": ["$_id", new ObjectId(userId)] } }
        });
    }

    const aggregates = [];
    if (queryObject.query) {
        aggregates.push({
            "$match": {
                "$or": [
                    { "title": { "$regex": `.*${queryObject.query}.*`, "$options": 'i' }, },
                    { "ingredients": { "$regex": `.*${queryObject.query}.*`, "$options": 'i' }, }
                ]
            }
        });
    }
    if (queryObject.categories) {
        const c = queryObject.categories.split(',').map(e => new ObjectId(e));
        aggregates.push({ "$match": { "categories": { "$in": c } }, });
    }
    if (queryObject.selectedDiets) {
        const c = queryObject.selectedDiets.split(',').map(e => new ObjectId(e));
        aggregates.push({ "$match": { "specialDiets": { "$in": c } }, });
    }
    if (queryObject.cookingMethods) {
        const c = queryObject.cookingMethods.split(',').map(e => new ObjectId(e));
        aggregates.push({ "$match": { "cookingMethods": { "$in": c } }, });
    }
    if (queryObject.difficulty) {
        aggregates.push({ "$match": { "difficulty": { "$eq": new ObjectId(queryObject.difficulty) } }, });
    }
    if (forUserIdSubscriptions) {
        let subscriptions = await Subscription.find({ userId: forUserIdSubscriptions });
        subscriptions = subscriptions.map((v) => `${v.followingUserId}`);
        aggregates.push(
            { "$match": { "authorId": { "$in": subscriptions } } },
            { "$sort": { ['updatedTimestamp']: -1, } },
        );
    }
    if (queryObject.caloriesFrom) {
        aggregates.push({ "$match": { "caloriesPerServing": { "$gte": parseInt(queryObject.caloriesFrom) } }, });
    }
    if (queryObject.caloriesTo) {
        aggregates.push({ "$match": { "caloriesPerServing": { "$lte": parseInt(queryObject.caloriesTo) } }, });
    }
    if (queryObject.ratingFrom) {
        aggregates.push({ "$match": { "rating": { "$gte": parseInt(queryObject.ratingFrom) } }, });
    }
    if (queryObject.ratingTo) {
        aggregates.push({ "$match": { "rating": { "$lte": parseInt(queryObject.ratingTo) } }, });
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
        {
            "$lookup": {
                "from": "cookingtimes",
                "localField": "_id",
                "foreignField": "recipeId",
                "as": "cookingTime",
            },
        },
        {
            "$lookup": {
                "from": "cookingmethods",
                "localField": "cookingMethods",
                "foreignField": "_id",
                "as": "cookingMethods",
            },
        },
        {
            "$lookup": {
                "from": "specialdiets",
                "localField": "specialDiets",
                "foreignField": "_id",
                "as": "specialDiets",
            },
        },
        { "$unwind": { path: "$difficulty" } },
        { "$unwind": { path: "$author" } },
        { "$unwind": { path: "$cookingTime" } },
    );

    if (queryObject.sortBy) {
        const sortOption = await SortOption.findById(queryObject.sortBy);
        if (sortOption.field.indexOf('&') != -1) {
            const s = {};
            sortOption.field.split('&').forEach((e) => {
                s[e] = sortOption.order;
            });
            aggregates.push({ "$sort": s },);
        } else {
            aggregates.push({ "$sort": { [sortOption.field]: sortOption.order, } },);
        }
    }

    if (queryObject.cookingTimeFrom) {
        aggregates.push({ "$match": { "cookingTime.total": { "$gte": parseInt(queryObject.cookingTimeFrom) } }, });
    }
    if (queryObject.cookingTimeTo) {
        aggregates.push({ "$match": { "cookingTime.total": { "$lte": parseInt(queryObject.cookingTimeTo) } }, });
    }

    aggregates.push(
        {
            $facet: {
                results: [
                    { $skip: (page - 1) * pageSize },
                    { $limit: pageSize },
                ],
                count: [
                    { $group: { _id: null, count: { $sum: 1 } } }
                ]
            }
        },
        {
            $project: {
                count: { $arrayElemAt: ['$count.count', 0] },
                recipes: '$results'
            }
        },
        {
            $addFields: {
                hasMoreData: {
                    $cond: {
                        if: { $gt: ['$count', (page * pageSize)] },
                        then: true,
                        else: false
                    }
                }
            }
        },
    );

    return aggregates;
}