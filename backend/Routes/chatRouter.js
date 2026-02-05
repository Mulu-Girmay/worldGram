const express = require("express");
const router = express.Router();

const {
  createChat,
  sendMessage,
  getMessages,
} = require("../Controllers/chatController");

router.post("/create", createChat);
router.post("/:chatId/message", sendMessage);
router.get("/:chatId/messages", getMessages);

module.exports = router;
