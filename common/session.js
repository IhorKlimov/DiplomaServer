var jwt = require('jsonwebtoken');
const secret = process.env.SECRET;
console.log(secret);

module.exports = {
    createSession: (userId) => {
        return jwt.sign({ userId: userId }, secret);
    },
    getUserId: (token) => {
        try {
            const decoded = jwt.verify(token, secret);
            return decoded.userId;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}