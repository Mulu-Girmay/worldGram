const mongoose = require("mongoose");
const groupSchema = new mongoose.Schema(
  {
    basicInfo: {
      chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
      groupName: { type: String },
      groupUsername: { type: String },
      description: { type: String },
      groupPhoto: { type: String },
    },
    members: {
      members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    permissions: {
      canSendMessages: { type: Boolean, default: true },
      canSendMedia: { type: Boolean, default: true },
      canPinMessages: { type: Boolean, default: true },
      canAddMembers: { type: Boolean, default: true },
    },
    settings: {
      isPublic: { type: Boolean, default: true },
      inviteLink: { type: String },
      slowModeSeconds: { type: String },
      MaxMembers: { type: Number },
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Group", groupSchema);
