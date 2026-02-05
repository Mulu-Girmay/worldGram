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
    views: [
      {
        viewNumber: { type: Number, default: 0 },
        viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    forward: {
      forwardNumber: { type: Number, default: 0 },
      forwarders: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      forwardedTo: { type: mongoose.Schema.Types.ObjectId },
    },
    reactions: [
      {
        emoji: String,
        count: Number,
        reactors: [{ type: mongoose.Schema.Types.ObjectId }],
      },
    ],
    isPinned: { type: Boolean, default: false },
    schedulesAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("ChannelPost", channelPostSchema);
