const { mkdir } = require('node:fs/promises');
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 3000;

module.exports = function (app) {
    app.post('/upload', async (req, res) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        let file = req.files['0'];
        console.log(file);

        await mkdir('public/images', { recursive: true });

        const newFileName = `${uuidv4()}${file.name.substring(file.name.lastIndexOf('.'), file.name.length)}`;

        file.mv(`public/images/${newFileName}`)
            .then(() => {
                const protocol = req.protocol;
                const host = req.hostname;

                const fullUrl = `${protocol}://${host}:${port}/images/${newFileName}`;

                res.send({ imageUrl: fullUrl });
            })
            .catch((error) => {
                console.log(error)
                return res.status(500).send(error.message);
            });
    });

}