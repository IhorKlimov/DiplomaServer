const Difficulty = require("../model/difficulty");

module.exports = function (app) {
    app.post('/difficulty', async (req, res) => {
        try {
            const name = req.body.name;
            const value = req.body.value;

            const difficulty = Difficulty({
                name, value,
            });

            await difficulty.save();

            res.send({ status: 'Saved' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.delete('/difficulty/:id', async (req, res) => {
        try {
            const id = req.params.id;

            if (!id) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            await Difficulty.findByIdAndDelete(id);
            res.send({ status: 'Deleted' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/difficulties', async (req, res) => {
        try {
            const difficulties = await Difficulty.find();
            res.send(difficulties);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}