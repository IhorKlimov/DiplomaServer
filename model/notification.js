const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const notificationSchema = new mongoose.Schema({
    userId: { type: ObjectId, required: true },
    text: { type: String, required: true },
    href: { type: String, required: true },
    isRead: { type: Boolean, required: true },
    timestamp: { type: Number, required: true },
});
const Notification = mongoose.model('notifications', notificationSchema);

module.exports = Notification;

