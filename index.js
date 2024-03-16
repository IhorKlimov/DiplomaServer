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

// Session
const session = require('./session/session');


// Database models
const User = require('./database/schema/user');
const Recipe = require('./database/schema/recipe');
const { ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 3000;
const uri = "mongodb://localhost:27017/test";
// const client = new MongoClient(uri);
// const database = client.db('test');
mongoose.connect(uri);


app.use(fileUpload());
app.use(express.urlencoded());
app.use(cors());
app.use(express.static('public'));

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
        console.log(data);

        const recipe = data[0];
        if (verifyAuthor === 'true' && recipe.authorId != userId) {
            res.status(401).send('Unauthorized. This recipe does not belog to this user');
            return;
        }
        res.send(recipe);
    } catch (e) {
        res.send(e);
    } finally {
        // await client.close();
    }
})

app.get('/authors', async (req, res) => {
    try {
        const data = await User.find();
        res.send(data);
    } catch (e) {
        res.send(e);
    } finally {
        // await client.close();
    }
});

app.get('/author', async (req, res) => {
    try {
        let userId = req.query.userId;
        const getMyProfile = req.query.getMyProfile;
        if (getMyProfile === 'true') {
            userId = session.getUserId(req.get('session'));
            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }
        } else if (!userId) {
            res.status(400).send('Missing attiributes');
            return;
        }
        const user = await User.findById(userId);
        res.send(user);
    } catch (e) {
        res.status(500).send(e.messsage);
    }
});

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

app.post('/author', async (req, res) => {
    try {
        const user = User({
            userName: req.body.userName,
            email: req.body.email,
            password: generateHash(req.body.password),
            imageUrl: req.body.imageUrl
        });

        const model = await user.save();
        const token = session.createSession(model._id);
        res.send({ sessionId: token });
    } catch (e) {
        console.log(e)
        if (e.code == 11000 && e.keyPattern.userName == 1) {
            res.status(400).send('This user name is already taken');
        } else if (e.code == 11000 && e.keyPattern.email == 1) {
            res.status(400).send('This email is already taken');
        } else {
            res.status(500).send(e.message);
        }
    } finally {
        // await client.close();
    }
});

app.put('/author', async (req, res) => {
    try {
        const userId = session.getUserId(req.get('session'));
        if (!userId) {
            res.status(401).send('Unauthorized. Missing user id');
            return;
        }

        const imageUrl = req.body.imageUrl === 'null' ? null : req.body.imageUrl;
        await User.findByIdAndUpdate(userId, {
            userName: req.body.userName,
            imageUrl: imageUrl,
        });
        res.send({ status: 'Saved changes' });
    } catch (e) {
        if (e.codeName == 'DuplicateKey' && e.keyPattern.userName == 1) {
            res.status(400).send('This user name is already taken');
        } else {
            res.status(500).send(e.message);
        }
    } finally {
        // await client.close();
    }
});

app.post('/logIn', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        let isAuthenticated = user != null && isPasswordValid(user.password, req.body.password);
        if (isAuthenticated) {
            const token = session.createSession(user._id);
            res.send({ sessionId: token });
        } else {
            res.status(401).send("Wrong credentials");
        }
    } catch (e) {

    } finally {

    }
})


function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

function isPasswordValid(userPassword, password) {
    return bcrypt.compareSync(password, userPassword);
};

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
