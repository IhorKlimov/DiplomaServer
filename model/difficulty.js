const mongoose = require('mongoose');

const difficultySchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
});
const Difficulty = mongoose.model('difficulties', difficultySchema);

module.exports = Difficulty;