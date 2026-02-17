const express = require("express");
const router = express.Router();
const upload = require("../Middleware/multer");
const auth = require("../Middleware/authMiddleware");

const {
  createChat,
  sendMessage,
  getMessages,
  reactToMessage,
  addViewToMessage,
  forwardMessage,
  listChats,
  getChatById,
  getMessagesPaged,
  editMessage,
  deleteMessage,
  sendMediaMessage,
  markChatRead,
  getUnreadCount,
  updateChatSettings,
} = require("../Controllers/chatController");

router.post("/create", auth, createChat);
router.post("/create/:groupId", auth, createChat);

router.post("/:chatId/message", auth, sendMessage);
router.get("/:chatId/messages", auth, getMessages);
router.get("/", auth, listChats);
router.get("/:chatId", auth, getChatById);
router.get("/:chatId/messages/paged", auth, getMessagesPaged);
router.patch("/:chatId/message/:messageId", auth, editMessage);
router.delete("/:chatId/message/:messageId", auth, deleteMessage);
router.post(
  "/:chatId/message/media",
  auth,
  upload.single("media"),
  sendMediaMessage,
);
router.post("/:chatId/read", auth, markChatRead);
router.get("/:chatId/unread-count", auth, getUnreadCount);
router.patch("/:chatId/settings", auth, updateChatSettings);
router.post(
  "/reactMessage/:chatId/:messageId",
  auth,
  reactToMessage,
);
router.post(
  "/:chatId/messages/:messageId/view",
  auth,
  addViewToMessage,
);
router.post(
  "/forwardMessage/:chatId/:messageId",
  auth,
  forwardMessage,
);
module.exports = router;
