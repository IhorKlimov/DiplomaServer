const User = require('../model/user');
const session = require('../common/session');


module.exports = function (app) {

    app.post('/logIn', async (req, res) => {
        try {
            let user = await User.findOne({ email: req.body.email });
            let isAuthenticated = user != null && isPasswordValid(user.password, req.body.password);
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