const User = require('../model/user');
const session = require('../common/session');

module.exports = function (app) {

    app.get('/authors', async (req, res) => {
        try {
            const data = await User.find();
            res.send(data);
        } catch (e) {
            res.send(e);
        } finally {
            // await client.close();
        }
    });

    app.get('/author', async (req, res) => {
        try {
            let userId = req.query.userId;
            const getMyProfile = req.query.getMyProfile;
            if (getMyProfile === 'true') {
                userId = session.getUserId(req.get('session'));
                if (!userId) {
                    res.status(401).send('Unauthorized. Missing user id');
                    return;
                }
            } else if (!userId) {
                res.status(400).send('Missing attiributes');
                return;
            }
            const user = await User.findById(userId);
            res.send(user);
        } catch (e) {
            res.status(500).send(e.messsage);
        }
    });

    app.post('/author', async (req, res) => {
        try {
            const user = User({
                userName: req.body.userName,
                email: req.body.email,
                password: generateHash(req.body.password),
                imageUrl: req.body.imageUrl
            });

            const model = await user.save();
            const token = session.createSession(model._id);
            res.send({ sessionId: token });
        } catch (e) {
            console.log(e)
            if (e.code == 11000 && e.keyPattern.userName == 1) {
                res.status(400).send('This user name is already taken');
            } else if (e.code == 11000 && e.keyPattern.email == 1) {
                res.status(400).send('This email is already taken');
            } else {
                res.status(500).send(e.message);
            }
        } finally {
            // await client.close();
        }
    });

    app.put('/author', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            const imageUrl = req.body.imageUrl === 'null' ? null : req.body.imageUrl;
            await User.findByIdAndUpdate(userId, {
                userName: req.body.userName,
                imageUrl: imageUrl,
            });
            res.send({ status: 'Saved changes' });
        } catch (e) {
            if (e.codeName == 'DuplicateKey' && e.keyPattern.userName == 1) {
                res.status(400).send('This user name is already taken');
            } else {
                res.status(500).send(e.message);
            }
        } finally {
            // await client.close();
        }
    });
}