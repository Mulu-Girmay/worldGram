const express = require("express");
const {
  addChannel,
  updateChannel,
  deleteChannel,
  addAdmin,
  removeAdmin,
  getChannelById,
  listChannels,
  listMyChannels,
  subscribeChannel,
  unsubscribeChannel,
  getChannelUnreadCount,
  muteChannel,
  unmuteChannel,
  updateAdminPermissions,
  getChannelRecentActions,
  approveJoinRequest,
  suggestPost,
  getChannelAnalytics,
} = require("../Controllers/channelController");
const channelRouter = express.Router();
const auth = require("../Middleware/authMiddleware");
const upload = require("../Middleware/multer");

channelRouter.get("/channels", auth, listChannels);
channelRouter.get("/channels/me", auth, listMyChannels);
channelRouter.get("/channels/:id", auth, getChannelById);
channelRouter.get("/channels/:id/unread-count", auth, getChannelUnreadCount);
channelRouter.post("/channels/:id/subscribe", auth, subscribeChannel);
channelRouter.post("/channels/:id/unsubscribe", auth, unsubscribeChannel);
channelRouter.post("/channels/:id/mute", auth, muteChannel);
channelRouter.post("/channels/:id/unmute", auth, unmuteChannel);
channelRouter.post("/channels/:id/suggest-post", auth, suggestPost);
channelRouter.post(
  "/channels/:id/join-request/:requestUserId/approve",
  auth,
  approveJoinRequest,
);
channelRouter.get("/channels/:id/recent-actions", auth, getChannelRecentActions);
channelRouter.get("/channels/:id/analytics", auth, getChannelAnalytics);

channelRouter.post("/addChannel", auth, upload.single("media"), addChannel);
channelRouter.patch("/updateChannel/:id", auth, updateChannel);
channelRouter.delete("/deleteChannel/:id", auth, deleteChannel);
channelRouter.post("/addAdmin/:id", auth, addAdmin);
channelRouter.patch("/channels/:id/admin-permissions", auth, updateAdminPermissions);

channelRouter.delete("/removeAdmin/:id", auth, removeAdmin);
module.exports = channelRouter;
