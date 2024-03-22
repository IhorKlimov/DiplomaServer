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
            res.send({ status: 'Saved review', review: result, });
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

            const result = await Review.find({ recipeId });
            res.send(result);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });
}