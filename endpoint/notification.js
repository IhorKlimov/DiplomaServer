const Notification = require("../model/notification");
const session = require('../common/session');
const { ObjectId } = require('mongodb');

module.exports = function (app) {

    app.get('/notifications', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            const result = await Notification.aggregate([
                { "$match": { "userId": { "$eq": new ObjectId(userId) } } },
                { "$sort": { ['timestamp']: -1, } },
            ]);
            res.send(result);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    app.post('/mark-notifications-read', async (req, res) => {
        try {
            const userId = session.getUserId(req.get('session'));

            if (!userId) {
                res.status(401).send('Не авторизований. Відсутній ідентифікатор користувача');
                return;
            }

            await Notification.updateMany({ userId }, { isRead: true });
            res.send({ status: 'Success' });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

}