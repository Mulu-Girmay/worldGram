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

channelSchema.index({ "basicInfo.userName": 1 }, { unique: true, sparse: true });
channelSchema.index({ "settings.inviteLink": 1 }, { sparse: true });
channelSchema.index({ "ownership.ownerId": 1, _id: -1 });
channelSchema.index({ "ownership.admins": 1, _id: -1 });
channelSchema.index({ "audience.subscribers": 1, _id: -1 });
channelSchema.index({ "settings.isPublic": 1, _id: -1 });

module.exports = mongoose.model("Channel", channelSchema);
