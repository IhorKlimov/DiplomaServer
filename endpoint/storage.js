const { mkdir } = require('node:fs/promises');
const { v4: uuidv4 } = require('uuid');
const admin = require("firebase-admin");
const { getStorage, getDownloadURL } = require('firebase-admin/storage');
const sharp = require('sharp');
const port = process.env.PORT || 3000;
const isProd = process.env.IS_PROD;

// Firestore setup
const serviceAccount = require('../serviceAccount.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: serviceAccount.storage_bucket,
});
const bucket = getStorage().bucket();

module.exports = function (app) {
    app.post('/upload', async (req, res) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        const isProfileImage = req.body.isProfileImage;
        const size = isProfileImage == 'true' ? 200 : 600;

        try {
            let file = req.files['0'];

            if (isProd == 'true') {
                const newFileName = `${uuidv4()}${file.name.substring(file.name.lastIndexOf('.'), file.name.length)}`;
                const buffer = await sharp(file.data)
                    .jpeg({ quality: 60 })
                    .resize(size)
                    .toBuffer();

                await bucket.file(newFileName).save(buffer);
                const fileRef = bucket.file(newFileName);
                const url = await getDownloadURL(fileRef);

                res.send({ imageUrl: url });
            } else {
                await mkdir('public/images', { recursive: true });

                const newFileName = `${uuidv4()}${file.name.substring(file.name.lastIndexOf('.'), file.name.length)}`;
                await sharp(file.data)
                    .jpeg({ quality: 60 })
                    .resize(size)
                    .toFile(`public/images/${newFileName}`);

                const protocol = req.protocol;
                const host = req.hostname;
                const fullUrl = `${protocol}://${host}:${port}/images/${newFileName}`;

                res.send({ imageUrl: fullUrl });
            }
        } catch (e) {
            console.log(e);
            res.status(500).send(e.message);
        }
    });

}