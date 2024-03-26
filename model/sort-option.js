const mongoose = require('mongoose');

const sortOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
});
const SortOption = mongoose.model('sortoptions', sortOptionSchema);

module.exports = SortOption;