const SortOption = require("../model/sort-option");

module.exports = function (app) {
    app.post('/sort-option', async (req, res) => {
        try {
            const name = req.body.name;
            const field = req.body.field;
            const order = req.body.order;

            const sortOption = SortOption({
                name, field, order,
            });

            await sortOption.save();

            res.send({ status: 'Saved' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.delete('/sort-option/:id', async (req, res) => {
        try {
            const id = req.params.id;

            if (!id) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            await SortOption.findByIdAndDelete(id);
            res.send({ status: 'Deleted' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/sort-options', async (req, res) => {
        try {
            const sortOptions = await SortOption.find();
            res.send(sortOptions);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}