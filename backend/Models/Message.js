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
      topicId: {
        type: mongoose.Schema.Types.ObjectId,
      },
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
    forward: {
      count: { type: Number, default: 0 },
      lastForwardedAt: Date,
      lastForwardedTo: { type: mongoose.Schema.Types.ObjectId },
      forwardedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      forwardedAt: Date,
      original: {
        type: { type: String, enum: ["message", "post", "story"] },
        id: { type: mongoose.Schema.Types.ObjectId },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      snapshot: {
        contentType: {
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
        text: String,
        mediaURL: String,
        fileName: String,
        fileSize: Number,
        duration: Number,
      },
    },
    state: {
      isEdited: { type: Boolean, default: false },
      isDeleted: { type: Boolean, default: false },
      readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      reactions: { type: String, enum: [":)", ":("] },
    },
    reactions: [
      {
        emoji: String,
        count: Number,
        reactors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", messageSchema);
