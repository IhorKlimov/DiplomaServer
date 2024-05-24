const mongoose = require('mongoose');

const specialDietSchema = new mongoose.Schema({
    name: { type: String, required: true },
});
const SpecialDiet = mongoose.model('specialdiets', specialDietSchema);

module.exports = SpecialDiet;