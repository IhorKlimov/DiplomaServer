const session = require("../common/session");
const Subscription = require("../model/subscription");

module.exports = function (app) {

    app.get('/subscription-ids', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            const result = await Subscription.find({ userId });
            const list = result.map((e) => e.followingUserId);
            res.send(list);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/subscriptions', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            const result = await Subscription.aggregate([
                { $match: { $expr: { $eq: ['$userId', { $toObjectId: userId }] } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'followingUserId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: { path: "$user" } },
                { $replaceRoot: { newRoot: "$user" } }
            ]);

            res.send(result);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/subscription-ids', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            const result = await Subscription.find({ userId });
            const list = result.map((e) => e.followingUserId);
            res.send(list);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.get('/subscription-status', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const followingUserId = req.query.followingUserId;

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            if (!followingUserId) {
                res.status(400).send('Відсутні атрибути');
                return;
            }
            const existing = await Subscription.find({
                userId, followingUserId,
            });

            res.send({ isSubscribed: existing.length > 0 });
        } catch (e) {
            res.status(500).send(e.message);
        }
    });

    app.post('/subscription', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));
            const followingUserId = req.body.followingUserId;

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            const existing = await Subscription.find({
                userId, followingUserId,
            });

            if (existing.length > 0) {
                await Subscription.findOneAndDelete({
                    userId, followingUserId,
                });
                res.send({ isSubscribed: false });
            } else {
                const sb = Subscription({
                    userId, followingUserId,
                });

                const result = await sb.save();
                res.send({ isSubscribed: true });
            }
        } catch (e) {
            res.status(500).send(e.message);
        }
    });
}