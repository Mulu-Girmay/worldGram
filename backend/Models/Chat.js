const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["private", "group", "channel"] },
    participants: { type: Array },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Chat", chatSchema);
