const Notification = require("../model/notification");
const User = require("../model/user");
const Recipe = require("../model/recipe");
const Subscription = require("../model/subscription");

module.exports = {
    createNotificationForReview: async function (fromUserId, recipeId) {
        const recipe = await Recipe.findById(recipeId);

        if (recipe.authorId == fromUserId) {
            return;
        }

        const user = await User.findById(fromUserId);
        const notification = Notification({
            userId: recipe.authorId,
            text: `${user.userName} залишив(ла) відгук на ваш рецепт`,
            href: `/recipe/${recipeId}`,
            isRead: false,
            timestamp: new Date().getTime()
        });
        await notification.save();
    },
    createNotificationForRecipe: async function (userId, recipeId) {
        const user = await User.findById(userId);

        const subscriptions = await Subscription.find({ followingUserId: userId });
        for (let s in subscriptions) {
            const subscription = subscriptions[s];
            const notification = Notification({
                userId: subscription.userId,
                text: `${user.userName} створив(ла) новий рецепт!`,
                href: `/recipe/${recipeId}`,
                isRead: false,
                timestamp: new Date().getTime()
            });
            await notification.save();
        }
    }
};