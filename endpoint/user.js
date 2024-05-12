const User = require('../model/user');
const session = require('../common/session');
const utils = require('../common/password-utils');
const AccountDetails = require('../model/account-details');
const Review = require('../model/review');
const FavoriteRecipe = require('../model/favorite-recipe');
const Notification = require('../model/notification');
const Recipe = require('../model/recipe');
const Subscription = require('../model/subscription');
const ReviewLike = require('../model/review-like');

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
                imageUrl: req.body.imageUrl
            });

            const model = await user.save();
            const accountDetails = AccountDetails({
                userId: model._id,
                password: utils.generateHash(req.body.password),
            });
            await accountDetails.save();
            const token = session.createSession(model._id);
            res.send({ sessionId: token });
        } catch (e) {
            console.log(e)
            if (e.code == 11000 && e.keyPattern.userName == 1) {
                res.status(400).send('Це ім\'я користувача вже зайняте');
            } else if (e.code == 11000 && e.keyPattern.email == 1) {
                res.status(400).send('Ця електронна адреса вже зайнята');
            } else {
                res.status(500).send(e.message);
            }
        } finally {
            // await client.close();
        }
    });

    app.post('/social-sign-in', async (req, res) => {
        try {
            let existingUser = await User.find({ email: req.body.email });
            existingUser = existingUser[0];
            if (existingUser) {
                let details = await AccountDetails.find({ userId: existingUser._id });
                details = details[0];

                if (details.provider == req.body.provider) {
                    const token = session.createSession(existingUser._id);
                    res.send({ sessionId: token });
                } else {
                    res.status(400).send('Ця електронна адреса вже зайнята');
                }
                return;
            }

            const user = User({
                userName: req.body.userName,
                email: req.body.email,
                imageUrl: req.body.imageUrl
            });

            const model = await user.save();
            const accountDetails = AccountDetails({
                userId: model._id,
                provider: req.body.provider,
            });
            await accountDetails.save();
            const token = session.createSession(model._id);
            res.send({ sessionId: token });
        } catch (e) {
            console.log(e)
            if (e.code == 11000 && e.keyPattern.userName == 1) {
                res.status(400).send('Це ім\'я користувача вже зайняте');
            } else if (e.code == 11000 && e.keyPattern.email == 1) {
                res.status(400).send('Ця електронна адреса вже зайнята');
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
                res.status(400).send('Це ім\'я користувача вже зайняте');
            } else {
                res.status(500).send(e.message);
            }
        } finally {
            // await client.close();
        }
    });

    app.delete('/author', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            if (!userId) {
                res.status(401).send('Unauthorized. Missing user id');
                return;
            }

            await User.findByIdAndDelete(userId);
            await AccountDetails.findOneAndDelete({ userId });
            await Review.deleteMany({ userId });
            await FavoriteRecipe.deleteMany({ userId });
            await Notification.deleteMany({ userId });
            await Recipe.deleteMany({ userId });
            await Subscription.deleteMany({ userId });
            await ReviewLike.deleteMany({ userId });

            res.send({ status: 'User deleted' });
        } catch (e) {
            res.status(500).send(e.message);
        } finally {
            // await client.close();
        }
    });
}