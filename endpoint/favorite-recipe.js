const { ObjectId } = require("mongodb");
const session = require("../common/session");
const FavoriteRecipe = require('../model/favorite-recipe');
const Recipe = require('../model/recipe');
const SortOption = require('../model/sort-option');
const pageSize = 12;

module.exports = function (app) {

    app.get('/favorite-recipe-ids', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
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
            const query = req.query.query;
            const categories = req.query.categories;
            const cookingMethods = req.query.cookingMethods;
            const difficulty = req.query.difficulty;
            const sortBy = req.query.sortBy;
            const caloriesFrom = req.query.caloriesFrom;
            const caloriesTo = req.query.caloriesTo;
            const selectedDiets = req.query.selectedDiets;
            const ratingFrom = req.query.ratingFrom;
            const ratingTo = req.query.ratingTo;
            const cookingTimeFrom = req.query.cookingTimeFrom;
            const cookingTimeTo = req.query.cookingTimeTo;
            const selectedIngredients = req.query.selectedIngredients;
            const page = req.query.page;

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            const result = await FavoriteRecipe.find({ userId: userId });
            const ids = result.map((e) => new ObjectId(e.recipeId));

            const aggregates = [{ "$match": { "_id": { "$in": ids } } }];
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
            if (selectedDiets) {
                const c = selectedDiets.split(',').map(e => new ObjectId(e));
                aggregates.push({ "$match": { "specialDiets": { "$in": c } }, });
            }
            if (cookingMethods) {
                const c = cookingMethods.split(',').map(e => new ObjectId(e));
                aggregates.push({ "$match": { "cookingMethods": { "$in": c } }, });
            }
            if (difficulty) {
                aggregates.push({ "$match": { "difficulty": { "$eq": new ObjectId(difficulty) } }, });
            }
            if (caloriesFrom) {
                aggregates.push({ "$match": { "caloriesPerServing": { "$gte": parseInt(caloriesFrom) } }, });
            }
            if (caloriesTo) {
                aggregates.push({ "$match": { "caloriesPerServing": { "$lte": parseInt(caloriesTo) } }, });
            }
            if (ratingFrom) {
                aggregates.push({ "$match": { "rating": { "$gte": parseInt(ratingFrom) } }, });
            }
            if (ratingTo) {
                aggregates.push({ "$match": { "rating": { "$lte": parseInt(ratingTo) } }, });
            }
            if (sortBy) {
                const sortOption = await SortOption.findById(sortBy);
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

            aggregates.push(
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
                        "from": "ingredients",
                        "localField": "ingredients",
                        "foreignField": "_id",
                        "as": "ingredients",
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
                { "$unwind": { path: "$cookingTime" } },
                { "$unwind": { path: "$difficulty" } },
                { "$unwind": { path: "$author" } },
            );

            if (selectedIngredients){
                const c = selectedIngredients.split(',');
                aggregates.push({ "$match": { "ingredients.name": { "$in": c } }, });
            }
            if (cookingTimeFrom) {
                aggregates.push({ "$match": { "cookingTime.total": { "$gte": parseInt(cookingTimeFrom) } }, });
            }
            if (cookingTimeTo) {
                aggregates.push({ "$match": { "cookingTime.total": { "$lte": parseInt(cookingTimeTo) } }, });
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

            const data = await Recipe.aggregate(aggregates).exec();

            res.send(data[0]);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/favorite-recipe-status', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const recipeId = req.query.recipeId;

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            if (!recipeId) {
                res.status(400).send('Відсутні атрибути');
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
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }
            if (!recipeId) {
                res.status(400).send('Відсутні атрибути');
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