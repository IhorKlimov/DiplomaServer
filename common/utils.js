const bcrypt = require('bcrypt');

module.exports = {
    generateHash: (password) => {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
    },
    isPasswordValid: (userPassword, password) => {
        return bcrypt.compareSync(password, userPassword);
    },
}