const express = require('express');
const cors = require('cors');
const path = require("path");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl);
console.log('db url '+ dbUrl)
console.log('Is prod: '+ process.env.IS_PROD)


app.use(fileUpload());
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Set up endpoints
require('./endpoint/user')(app);
require('./endpoint/authentication')(app);
require('./endpoint/storage')(app);
require('./endpoint/recipe')(app);
require('./endpoint/favorite-recipe')(app);
require('./endpoint/review')(app);
require('./endpoint/category')(app);
require('./endpoint/difficulty')(app);
require('./endpoint/sort-option')(app);
require('./endpoint/cooking-method')(app);
require('./endpoint/cooking-time')(app);
require('./endpoint/subscription')(app);
require('./endpoint/notification')(app);


app.get("/", express.static(path.join(__dirname, "./public")));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});