const express = require("express");
const router = express.Router();

const {
  createChat,
  sendMessage,
  getMessages,
  reactToMessage,
  addViewToMessage,
  forwardMessage,
} = require("../Controllers/chatController");

router.post("/create", createChat);
router.post("/create/:groupId", createChat);

router.post("/:chatId/message", sendMessage);
router.get("/:chatId/messages", getMessages);
router.post(
  "/reactMessage",
  require("../Middleware/authMiddleware"),
  reactToMessage,
);
router.post(
  "/:chatId/messages/:messageId/view",
  require("../Middleware/authMiddleware"),
  addViewToMessage,
);
router.post(
  "/forwardMessage/:chatId/:messageId",
  require("../Middleware/authMiddleware"),
  forwardMessage,
);
module.exports = router;
