const mongoose = require("mongoose");
const channelPostMediaSchema = new mongoose.Schema(
  {
    url: { type: String },
    type: { type: String },
    size: { type: Number },
  },
  { _id: false },
);

const channelPostSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorSignature: {
      show: { type: Boolean, default: false },
      title: { type: String, trim: true },
    },
    text: { type: String },
    media: [channelPostMediaSchema],
    views: {
      viewNumber: { type: Number, default: 0 },
      viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
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
        media: [channelPostMediaSchema],
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
    isSilent: { type: Boolean, default: false },
    deepLink: { type: String },
    schedulesAt: Date,
  },
  { timestamps: true },
);

channelPostSchema.index({ channelId: 1, _id: -1 });
channelPostSchema.index({ channelId: 1, createdAt: -1 });
channelPostSchema.index({ channelId: 1, authorId: 1, _id: -1 });

module.exports = mongoose.model("ChannelPost", channelPostSchema);
