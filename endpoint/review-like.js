const ReviewLike = require("../model/review-like");
const session = require('../common/session');

module.exports = function (app) {
    app.post('/review-like', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const reviewId = req.body.reviewId;

            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }
            if (!reviewId) {
                res.status(400).send('Missing attributes');
                return;
            }
            const existing = await ReviewLike.find({
                userId, reviewId,
            });

            if (existing.length > 0) {
                await ReviewLike.findOneAndDelete({
                    userId, reviewId,
                });
                res.send({ isLiked: false });
            } else {
                const rl = ReviewLike({
                    userId, reviewId,
                });

                const result = await rl.save();
                res.send({ isLiked: true });
            }
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/review-likes', async (req, res) => {
        try {
            const reviewId = req.query.reviewId;

            const reviewLikes = await ReviewLike.find({ reviewId });
            res.send(reviewLikes);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}