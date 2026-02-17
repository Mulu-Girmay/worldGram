const mongoose = require("mongoose");
const storySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  media: { type: String },
  mediaType: { type: String, enum: ["image", "video"] },
  caption: String,
  viewers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: Date,
    },
  ],
  reactions: [
    {
      emoji: String,
      count: Number,
      reactors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
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
      media: String,
      mediaType: { type: String, enum: ["image", "video"] },
      caption: String,
    },
  },
  privacy: {
    type: String,
    enum: ["public", "contacts", "closeFriends"],
    default: "contacts",
  },
  expiredAt: { type: Date, index: { expires: 0 } },
});
module.exports = mongoose.model("Story", storySchema);
