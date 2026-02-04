const mongoose = require("mongoose");
const storySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  mediaUrl: { url: String },
  mediaType: { type: String, enum: ["image", "video"] },
  caption: String,
  viewers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: Date,
    },
  ],
  reactions: [{ userId: mongoose.Schema.Types.ObjectId, emoji: String }],
  privacy: {
    type: String,
    enum: ["public", "contacts", "closeFriends"],
    default: "Contacts",
  },
  expiredAt: { type: Date, index: { expires: 0 } },
});
module.exports = mongoose.model("Story", storySchema);
