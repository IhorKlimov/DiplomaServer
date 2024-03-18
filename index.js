const express = require('express');
// const { MongoClient } = require("mongodb");
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const http = require("http");
const path = require("path");
const fs = require("fs");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const { mkdir } = require('node:fs/promises');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');

// Session
const session = require('./session/session');


// Database models
const User = require('./model/user');
const Recipe = require('./model/recipe');
const FavoriteRecipe = require('./model/favorite-recipe');


const app = express();
const port = process.env.PORT || 3000;
const uri = "mongodb://localhost:27017/test";
mongoose.connect(uri);


app.use(fileUpload());
app.use(express.urlencoded());
app.use(cors());
app.use(express.static('public'));

// Set up endpoints
require('./endpoint/user')(app);
require('./endpoint/authentication')(app);


app.get("/", express.static(path.join(__dirname, "./public")));

app.get('/recipes', async (req, res) => {
    let userId = req.query.userId;
    const showMyRecipes = req.query.showMyRecipes;

    const pipelines = [
        { "$match": { "$expr": { "$eq": ["$_id", "$$authorObjectId"] } } },
    ];

    if (showMyRecipes === 'true') {
        userId = session.getUserId(req.get('session'));
        if (!userId) {
            res.status(401).send('Unauthorized. Missing user id');
            return;
        }
    }

    if (userId) {
        pipelines.push({
            "$match": { "$expr": { "$eq": ["$_id", new ObjectId(userId)] } }
        });
    }

    try {
        const data = await Recipe.aggregate(
            [
                {
                    "$lookup": {
                        "let": { "authorObjectId": { "$toObjectId": "$authorId" } },
                        "from": "users",
                        "pipeline": pipelines,
                        "as": "author"
                    }
                },
                { "$unwind": { path: "$author" } }
            ]).exec();
        res.send(data);
    } catch (e) {
        res.send(e);
    } finally {
        // await client.close();
    }
})

app.get('/recipe', async (req, res) => {
    const id = req.query.id;
    const verifyAuthor = req.query.verifyAuthor;
    const userId = session.getUserId(req.get('session'));

    if (!id) {
        res.send("Missing attributes");
        return;
    }

    if (verifyAuthor === 'true' && !userId) {
        res.status(401).send('Unauthorized. Missing user id');
        return;
    }

    try {
        const data = await Recipe.aggregate(
            [
                { $match: { $expr: { $eq: ['$_id', { $toObjectId: id }] } } },
                {
                    "$lookup": {
                        "let": { "authorObjectId": { "$toObjectId": "$authorId" } },
                        "from": "users",
                        "pipeline": [
                            { "$match": { "$expr": { "$eq": ["$_id", "$$authorObjectId"] } } },
                        ],
                        "as": "author"
                    }
                },
                { "$unwind": { path: "$author" } }
            ]);
        const recipe = data[0];
        if (recipe == null) {
            res.status(404).send('Recipe not found');
            return;
        }
        if (verifyAuthor === 'true' && recipe.authorId != userId) {
            res.status(401).send('Unauthorized. This recipe does not belog to this user');
            return;
        }

        res.send(recipe);
    } catch (e) {
        res.status(500).send(e.message);
    } finally {
        // await client.close();
    }
})

app.post('/recipe', async (req, res) => {
    try {
        const userId = session.getUserId(req.get('session'));
        if (!userId) {
            res.status(401).send('Unauthorized. Missing user id');
            return;
        }

        const recipe = Recipe({
            title: req.body.title,
            imageUrl: req.body.imageUrl,
            description: req.body.text,
            authorId: userId,
        });
        const model = await recipe.save();
        res.send({ recipeId: model._id, });
    } catch (e) {
        res.status(400).send(e.message);
    } finally {
        // await client.close();
    }
});


app.put('/recipe', async (req, res) => {
    try {
        const userId = session.getUserId(req.get('session'));
        const recipeId = req.body.recipeId;
        if (!userId) {
            res.status(401).send('Unauthorized. Missing user id');
            return;
        }
        if (!recipeId) {
            res.status(400).send('Missing attributes');
            return;
        }

        const recipe = await Recipe.findById(recipeId);
        if (recipe.authorId != userId) {
            res.status(401).send('Unauthorized. This recipe does not belog to this user');
            return;
        }

        await Recipe.findByIdAndUpdate(recipeId, {
            title: req.body.title,
            imageUrl: req.body.imageUrl,
            description: req.body.text,
        });

        res.send({ status: 'Saved changes' });
    } catch (e) {
        res.status(400).send(e.message);
    } finally {
        // await client.close();
    }
});

app.delete('/recipe', async (req, res) => {
    try {
        const userId = session.getUserId(req.get('session'));
        const recipeId = req.body.recipeId;
        if (!userId) {
            res.status(401).send('Unauthorized. Missing user id');
            return;
        }
        if (!recipeId) {
            res.status(400).send('Missing attributes');
            return;
        }

        const recipe = await Recipe.findById(recipeId);
        if (recipe.authorId != userId) {
            res.status(401).send('Unauthorized. This recipe does not belog to this user');
            return;
        }

        await Recipe.findByIdAndDelete(recipeId);

        res.send({ status: 'Deleted recipe' });
    } catch (e) {
        res.status(400).send(e.message);
    } finally {
        // await client.close();
    }
})

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
            return res.status(500).send(error.message);
        });
});

function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

function isPasswordValid(userPassword, password) {
    return bcrypt.compareSync(password, userPassword);
};

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
