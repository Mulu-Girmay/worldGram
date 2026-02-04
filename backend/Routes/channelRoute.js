const express = require("express");
const {
  addChannel,
  updateChannel,
  deleteChannel,
  addAdmin,
  removeAdmin,
} = require("../Controllers/channelController");
const channelRouter = express.Router();

channelRouter.post(
  "/addChannel",
  require("../Middleware/authMiddleware"),
  addChannel,
);
channelRouter.patch(
  "/updateChannel/:id",
  require("../Middleware/authMiddleware"),
  updateChannel,
);
channelRouter.delete(
  "/deleteChannel/:id",
  require("../Middleware/authMiddleware"),
  deleteChannel,
);
channelRouter.post(
  "/addAdmin/:id",
  require("../Middleware/authMiddleware"),
  addAdmin,
);

channelRouter.delete(
  "/removeAdmin/:id",
  require("../Middleware/authMiddleware"),
  removeAdmin,
);
module.exports = channelRouter;
