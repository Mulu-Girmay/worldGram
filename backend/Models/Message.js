const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    identity: {
      chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    content: {
      ContentType: {
        type: String,
        enum: [
          "text",
          "image",
          "video",
          "audio",
          "file",
          "voice",
          "poll",
          "stickers",
        ],
      },
      text: { type: String },
      mediaURL: { type: String },
      fileName: { type: String },
      fileSize: { type: Number },
      duration: { type: Number },
    },
    Relations: {
      replyToMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      forwardedFromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      forwardedFromChatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    },
    state: {
      isEdited: { type: Boolean, default: false },
      isDeleted: { type: Boolean, default: false },
      readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      reactions: { type: String, enum: [":)", ":("] },
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", messageSchema);
