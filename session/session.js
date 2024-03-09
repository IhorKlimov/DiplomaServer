var jwt = require('jsonwebtoken');
const secret = 'shhhhh';

module.exports = {
    createSession: (userId) => {
        return jwt.sign({ userId: userId }, secret);
    },
    getUserId: (token) => {
        try {
            console.log(token);
            const decoded = jwt.verify(token, secret);
            console.log(decoded);
            return decoded.userId;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}