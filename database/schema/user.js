const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true, },
    email: { type: String, required: true, unique: true, },
    password: { type: String, required: true },
    imageUrl: { type: String }
});
const User = mongoose.model('users', userSchema);

module.exports = User;