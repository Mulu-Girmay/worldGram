const mongoose = require("mongoose");
const channelSchema = new mongoose.Schema(
  {
    basicInfo: {
      name: { type: String, required: true },
      userName: { type: String, unique: true },
      description: { type: String },
      channelPhoto: { type: String },
    },
    ownership: {
      ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    audience: {
      subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      subscriberCount: { type: number },
    },
    settings: {
      isPublic: { type: Boolean, default: true },
      inviteLink: { type: String },
      discussionGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Channel", channelSchema);
