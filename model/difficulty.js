const mongoose = require('mongoose');

const difficultySchema = new mongoose.Schema({
    name: { type: String, required: true },
});
const Difficulty = mongoose.model('difficulties', difficultySchema);

module.exports = Difficulty;