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
    views: { type: Number, default: 0 },
    forward: { type: Number, default: 0 },
    reactions: [{ emoji: String, count: Number }],
    isPinned: { type: Boolean, default: false },
    schedulesAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("ChannelPost", channelPostSchema);
