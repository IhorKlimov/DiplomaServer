const express = require('express');
// const { MongoClient } = require("mongodb");
const cors = require('cors');
const path = require("path");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');


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
require('./endpoint/storage')(app);
require('./endpoint/recipe')(app);


app.get("/", express.static(path.join(__dirname, "./public")));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
