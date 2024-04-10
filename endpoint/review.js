const session = require("../common/session");
const Review = require("../model/review");
const Recipe = require("../model/recipe");
const NotificationController = require("../controller/notification");

module.exports = function (app) {
    app.post('/review', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const text = req.body.text;
            const stars = req.body.stars;
            const recipeId = req.body.recipeId;

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            } else if (!text || !recipeId) {
                res.status(400).send('Missing attributes');
                return;
            }

            const review = Review({
                stars,
                userId,
                text,
                recipeId,
                createdTimestamp: new Date().getTime(),
                updatedTimestamp: new Date().getTime(),
            });

            const result = await review.save();
            await NotificationController.createNotificationForReview(userId, recipeId);
            const reviewWithUser = await Review.aggregate(
                [
                    { "$match": { "$expr": { "$eq": ["$_id", result._id] } } },
                    {
                        "$lookup": {
                            "let": { "userIdObject": { "$toObjectId": "$userId" } },
                            "from": "users",
                            "pipeline": [
                                { "$match": { "$expr": { "$eq": ["$_id", "$$userIdObject"] } } },
                            ],
                            "as": "user"
                        }
                    },
                    { "$unwind": { path: "$user" } }
                ]).exec();

            const reviews = await Review.find({ recipeId: recipeId, stars: { $ne: null } });
            if (reviews.length != 0) {
                let averageRating = reviews.reduce((acc, curr) => acc + curr.stars, 0) / reviews.length;
                averageRating = averageRating.toFixed(1);

                await Recipe.findByIdAndUpdate(recipeId, { rating: averageRating, })
            }

            res.send({ status: 'Saved review', review: reviewWithUser[0], });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/reviews', async (req, res) => {
        try {
            const recipeId = req.query.recipeId;

            if (!recipeId) {
                res.status(400).send('Missing attributes');
                return;
            }

            const data = await Review.aggregate(
                [
                    { "$match": { "$expr": { "$eq": ["$recipeId", recipeId] } }, },
                    { "$sort": { "updatedTimestamp": -1, } },
                    {
                        "$lookup": {
                            "let": { "userIdObject": { "$toObjectId": "$userId" } },
                            "from": "users",
                            "pipeline": [
                                { "$match": { "$expr": { "$eq": ["$_id", "$$userIdObject"] } } },
                            ],
                            "as": "user"
                        }
                    },
                    { "$unwind": { path: "$user" } }
                ]).exec();
            res.send(data);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });
}