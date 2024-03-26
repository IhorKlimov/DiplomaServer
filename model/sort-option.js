const mongoose = require('mongoose');

const sortOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    field: { type: String, required: true },
    order: { type: Number, required: true },
});
const SortOption = mongoose.model('sortoptions', sortOptionSchema);

module.exports = SortOption;