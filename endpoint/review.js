const session = require("../common/session");
const Review = require("../model/review");


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
                timestamp: new Date().getTime(),
            });

            const result = await review.save();

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
                    { "$sort": { "timestamp": -1, } },
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