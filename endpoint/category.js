const Category = require("../model/category");

module.exports = function (app) {
    app.post('/category', async (req, res) => {
        try {
            const name = req.body.name;

            if (!name) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            const category = Category({
                name,
            });

            await category.save();

            res.send({ status: 'Saved' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.delete('/category', async (req, res) => {
        try {
            const id = req.body.id;

            if (!id) {
                res.status(400).send('Відсутні атрибути');
                return;
            }

            await Category.findByIdAndDelete(id);
            res.send({ status: 'Deleted' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.get('/categories', async (req, res) => {
        try {
            const categories = await Category.find();
            res.send(categories);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}