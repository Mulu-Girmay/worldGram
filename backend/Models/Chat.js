const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["private", "group", "channel"] },
    participants: [{ type: mongoose.Schema.Types.ObjectId }],
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    viewerSettings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isPinned: { type: Boolean, default: false },
        isMuted: { type: Boolean, default: false },
      },
    ],

    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

chatSchema.index({ participants: 1, _id: -1 });
chatSchema.index({ type: 1, groupId: 1 });
chatSchema.index({ groupId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Chat", chatSchema);
