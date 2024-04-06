const CookingTime = require("../model/cooking-time");

module.exports = function (app) {
    app.post('/cooking-time', async (req, res) => {
        try {
            const prep = req.body.prep;
            const cooking = req.body.cooking;
            const recipeId = req.body.recipeId;
            const total = prep + cooking;

            const cookingTime = CookingTime({
                recipeId, prep, cooking, total,
            });

            await cookingTime.save();

            res.send({ status: 'Saved' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.delete('/cooking-time/:id', async (req, res) => {
        try {
            const id = req.params.id;

            if (!id) {
                res.status(400).send('Missing attributes');
                return;
            }

            await CookingTime.findByIdAndDelete(id);
            res.send({ status: 'Deleted' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/cooking-time', async (req, res) => {
        try {
            const cookingTimes = await CookingTime.find();
            res.send(cookingTimes);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    

}