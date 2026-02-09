const express = require("express");
const auth = require("../Middleware/authMiddleware");
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../Controllers/notificationController");

const notificationRouter = express.Router();

notificationRouter.get("/notifications", auth, listNotifications);
notificationRouter.post("/notifications/:id/read", auth, markNotificationRead);
notificationRouter.post(
  "/notifications/read-all",
  auth,
  markAllNotificationsRead,
);
notificationRouter.delete("/notifications/:id", auth, deleteNotification);

module.exports = notificationRouter;
