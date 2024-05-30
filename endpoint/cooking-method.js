const CookingMethod = require("../model/cooking-method");

module.exports = function (app) {
    app.post('/cooking-method', async (req, res) => {
        try {
            const name = req.body.name;

            if (!name) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            const cookingMethod = CookingMethod({
                name,
            });

            await cookingMethod.save();

            res.send({ status: 'Saved' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.delete('/cooking-method/:id', async (req, res) => {
        try {
            const id = req.params.id;

            if (!id) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            await CookingMethod.findByIdAndDelete(id);
            res.send({ status: 'Deleted' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/cooking-methods', async (req, res) => {
        try {
            const cookingMethods = await CookingMethod.find();
            res.send(cookingMethods);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}