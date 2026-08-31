const Notification = require("../models/Notification");
const { sendSuccess, sendError } = require("../utils/response");

// Get all notifications for logged in employee
exports.getNotifications = async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications

    return sendSuccess(res, "Notifications fetched successfully", { notifications: list });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Mark all notifications as read for logged in employee
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    return sendSuccess(res, "All notifications marked as read", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
    if (!notif) {
      return sendError(res, "Notification not found or unauthorized", 404);
    }

    await notif.deleteOne();
    return sendSuccess(res, "Notification deleted successfully", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
