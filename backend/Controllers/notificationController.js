const Notification = require("../Models/Notification");
const mongoose = require("mongoose");

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

exports.listNotifications = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = { userId: req.userId };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const notifications = await Notification.find(query)
      .sort({ _id: -1 })
      .limit(limit);
    const nextCursor =
      notifications.length === limit
        ? notifications[notifications.length - 1]._id
        : null;

    res.json({ items: notifications, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to list notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ err: "Notification not found" });
    }
    res.json({ message: "Notification marked read", notification });
  } catch (err) {
    res.status(500).json({ err: "Failed to mark notification read" });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true },
    );
    res.json({ message: "All notifications marked read" });
  } catch (err) {
    res.status(500).json({ err: "Failed to mark all notifications read" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!notification) {
      return res.status(404).json({ err: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ err: "Failed to delete notification" });
  }
};
