const mongoose = require("mongoose");
const channelPostSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    media: [{ url: String, type: String, size: Number }],
    views: {
      type: [
        {
          viewNumber: { type: Number, default: 0 },
          viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      default: [{ viewNumber: 0, viewers: [] }],
    },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
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
        text: String,
        media: [{ url: String, type: String, size: Number }],
        mediaType: String,
        fileName: String,
        fileSize: Number,
        duration: Number,
        caption: String,
      },
    },
    reactions: [
      {
        emoji: String,
        count: Number,
        reactors: [{ type: mongoose.Schema.Types.ObjectId }],
      },
    ],
    comments: [
      {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
        replies: [
          {
            authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            text: String,
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    isPinned: { type: Boolean, default: false },
    schedulesAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("ChannelPost", channelPostSchema);
