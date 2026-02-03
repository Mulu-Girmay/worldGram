const express = require("express");
const { addChannel } = require("../Controllers/channelController");
const channelRouter = express.Router();

channelRouter.post(
  "/addChannel",
  require("../Middleware/authMiddleware"),
  addChannel,
);
module.exports = channelRouter;
