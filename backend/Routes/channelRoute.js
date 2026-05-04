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
  getChannelInviteLink,
  joinChannelByInviteToken,
} = require("../Controllers/channelController");
const channelRouter = express.Router();
const auth = require("../Middleware/authMiddleware");
const upload = require("../Middleware/multer");
const { createRateLimiter } = require("../Middleware/rateLimit");

const channelWriteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 80,
  keyBuilder: (req) => `channel-write:${req.userId || req.ip}`,
});

const channelReadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 220,
  keyBuilder: (req) => `channel-read:${req.userId || req.ip}`,
});

channelRouter.get("/channels", auth, channelReadLimiter, listChannels);
channelRouter.get("/channels/me", auth, channelReadLimiter, listMyChannels);
channelRouter.get("/channels/:id", auth, channelReadLimiter, getChannelById);
channelRouter.get(
  "/channels/:id/unread-count",
  auth,
  channelReadLimiter,
  getChannelUnreadCount,
);
channelRouter.post(
  "/channels/:id/subscribe",
  auth,
  channelWriteLimiter,
  subscribeChannel,
);
channelRouter.post(
  "/channels/:id/unsubscribe",
  auth,
  channelWriteLimiter,
  unsubscribeChannel,
);
channelRouter.post("/channels/:id/mute", auth, channelWriteLimiter, muteChannel);
channelRouter.post(
  "/channels/:id/unmute",
  auth,
  channelWriteLimiter,
  unmuteChannel,
);
channelRouter.post(
  "/channels/:id/suggest-post",
  auth,
  channelWriteLimiter,
  suggestPost,
);
channelRouter.get(
  "/channels/:id/invite-link",
  auth,
  channelReadLimiter,
  getChannelInviteLink,
);
channelRouter.post(
  "/channels/:id/join-request/:requestUserId/approve",
  auth,
  channelWriteLimiter,
  approveJoinRequest,
);
channelRouter.post(
  "/channels/invite/:inviteToken/join",
  auth,
  channelWriteLimiter,
  joinChannelByInviteToken,
);
channelRouter.get(
  "/channels/:id/recent-actions",
  auth,
  channelReadLimiter,
  getChannelRecentActions,
);
channelRouter.get(
  "/channels/:id/analytics",
  auth,
  channelReadLimiter,
  getChannelAnalytics,
);

channelRouter.post(
  "/addChannel",
  auth,
  channelWriteLimiter,
  upload.single("media"),
  addChannel,
);
channelRouter.patch("/updateChannel/:id", auth, channelWriteLimiter, updateChannel);
channelRouter.delete("/deleteChannel/:id", auth, channelWriteLimiter, deleteChannel);
channelRouter.post("/addAdmin/:id", auth, channelWriteLimiter, addAdmin);
channelRouter.patch(
  "/channels/:id/admin-permissions",
  auth,
  channelWriteLimiter,
  updateAdminPermissions,
);

channelRouter.delete("/removeAdmin/:id", auth, channelWriteLimiter, removeAdmin);
module.exports = channelRouter;
