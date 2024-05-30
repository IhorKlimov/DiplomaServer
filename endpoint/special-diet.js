const SpecialDiet = require("../model/special-diet");

module.exports = function (app) {
    app.post('/special-diet', async (req, res) => {
        try {
            const name = req.body.name;

            if (!name) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            const diet = SpecialDiet({
                name,
            });

            await diet.save();

            res.send({ status: 'Saved' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.delete('/special-diet', async (req, res) => {
        try {
            const id = req.body.id;

            if (!id) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            await SpecialDiet.findByIdAndDelete(id);
            res.send({ status: 'Deleted' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/special-diets', async (req, res) => {
        try {
            const diets = await SpecialDiet.find();
            res.send(diets);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}