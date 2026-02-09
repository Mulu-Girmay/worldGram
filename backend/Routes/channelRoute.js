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
} = require("../Controllers/channelController");
const channelRouter = express.Router();
const auth = require("../Middleware/authMiddleware");

channelRouter.get("/channels", auth, listChannels);
channelRouter.get("/channels/me", auth, listMyChannels);
channelRouter.get("/channels/:id", auth, getChannelById);
channelRouter.post("/channels/:id/subscribe", auth, subscribeChannel);
channelRouter.post("/channels/:id/unsubscribe", auth, unsubscribeChannel);

channelRouter.post(
  "/addChannel",
  auth,
  addChannel,
);
channelRouter.patch(
  "/updateChannel/:id",
  auth,
  updateChannel,
);
channelRouter.delete(
  "/deleteChannel/:id",
  auth,
  deleteChannel,
);
channelRouter.post(
  "/addAdmin/:id",
  auth,
  addAdmin,
);

channelRouter.delete(
  "/removeAdmin/:id",
  auth,
  removeAdmin,
);
module.exports = channelRouter;
