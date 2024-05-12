const User = require('../model/user');
const session = require('../common/session');
const utils = require('../common/password-utils');

module.exports = function (app) {

    app.post('/logIn', async (req, res) => {
        try {
            let user = await User.aggregate([
                {
                    "$match": { "email": { "$eq": req.body.email } }
                },
                {
                    "$lookup": {
                        "localField": "_id",
                        "from": "accountdetails",
                        "foreignField": "userId",
                        "as": "credentials",
                    }
                },
                { "$unwind": { path: "$credentials" } }
            ]).exec();
            user = user[0];
            let isAuthenticated = user != null && utils.isPasswordValid(user.credentials.password, req.body.password);
            if (isAuthenticated) {
                const token = session.createSession(user._id);
                res.send({ sessionId: token });
            } else {
                res.status(401).send("Wrong credentials");
            }
        } catch (e) {

        } finally {

        }
    })
}