const express = require("express");
const router = express.Router();
const upload = require("../Middleware/multer");
const auth = require("../Middleware/authMiddleware");
const { createRateLimiter } = require("../Middleware/rateLimit");

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

const chatWriteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 80,
  keyBuilder: (req) => `chat-write:${req.userId || req.ip}`,
});

const chatCreateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 25,
  keyBuilder: (req) => `chat-create:${req.userId || req.ip}`,
});

const chatReactLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyBuilder: (req) => `chat-react:${req.userId || req.ip}`,
});

router.post("/create", auth, chatCreateLimiter, createChat);
router.post("/create/:groupId", auth, chatCreateLimiter, createChat);

router.post("/:chatId/message", auth, chatWriteLimiter, sendMessage);
router.get("/:chatId/messages", auth, getMessages);
router.get("/", auth, listChats);
router.get("/:chatId", auth, getChatById);
router.get("/:chatId/messages/paged", auth, getMessagesPaged);
router.patch("/:chatId/message/:messageId", auth, editMessage);
router.delete("/:chatId/message/:messageId", auth, deleteMessage);
router.post(
  "/:chatId/message/media",
  auth,
  chatWriteLimiter,
  upload.single("media"),
  sendMediaMessage,
);
router.post("/:chatId/read", auth, markChatRead);
router.get("/:chatId/unread-count", auth, getUnreadCount);
router.patch("/:chatId/settings", auth, updateChatSettings);
router.post(
  "/reactMessage/:chatId/:messageId",
  auth,
  chatReactLimiter,
  reactToMessage,
);
router.post("/:chatId/messages/:messageId/view", auth, addViewToMessage);
router.post(
  "/forwardMessage/:chatId/:messageId",
  auth,
  chatWriteLimiter,
  forwardMessage,
);
module.exports = router;
