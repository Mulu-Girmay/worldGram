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
      adminPermissions: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          permissions: {
            canPostMessages: { type: Boolean, default: true },
            canEditMessagesOfOthers: { type: Boolean, default: true },
            canDeleteMessages: { type: Boolean, default: true },
            canManageStories: { type: Boolean, default: false },
            canManageLivestreams: { type: Boolean, default: false },
            canAddAdmins: { type: Boolean, default: false },
          },
        },
      ],
    },
    audience: {
      subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      subscriberCount: { type: Number },
      mutedSubscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      pendingJoinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    settings: {
      isPublic: { type: Boolean, default: true },
      inviteLink: { type: String },
      discussionGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
      allowJoinRequests: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      showAuthorSignatures: { type: Boolean, default: false },
      contentProtection: { type: Boolean, default: false },
      allowSuggestedPosts: { type: Boolean, default: false },
      allowedReactions: [{ type: String }],
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Channel", channelSchema);
