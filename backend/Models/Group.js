const mongoose = require("mongoose");

const groupTopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isClosed: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true },
);

const permissionOverrideSchema = new mongoose.Schema(
  {
    canSendMessages: { type: Boolean },
    canSendMedia: { type: Boolean },
    canSendPhotos: { type: Boolean },
    canSendVideos: { type: Boolean },
    canSendStickers: { type: Boolean },
    canSendGifs: { type: Boolean },
    canSendVoiceVideo: { type: Boolean },
    canAddMembers: { type: Boolean },
    canPinMessages: { type: Boolean },
    canEmbedLinks: { type: Boolean },
    canCreatePolls: { type: Boolean },
    canChangeChatInfo: { type: Boolean },
  },
  { _id: false },
);

const memberExceptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    overrides: permissionOverrideSchema,
  },
  { _id: false },
);

const adminProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isAnonymous: { type: Boolean, default: false },
    customTitle: { type: String, trim: true },
    permissions: {
      canManageMembers: { type: Boolean, default: true },
      canManageTopics: { type: Boolean, default: true },
      canManageSettings: { type: Boolean, default: true },
      canManageLivestreams: { type: Boolean, default: false },
      canPostAnnouncements: { type: Boolean, default: true },
    },
  },
  { _id: false },
);

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
      adminProfiles: [adminProfileSchema],
    },
    permissions: {
      canSendMessages: { type: Boolean, default: true },
      canSendMedia: { type: Boolean, default: true },
      canSendPhotos: { type: Boolean, default: true },
      canSendVideos: { type: Boolean, default: true },
      canSendStickers: { type: Boolean, default: true },
      canSendGifs: { type: Boolean, default: true },
      canSendVoiceVideo: { type: Boolean, default: true },
      canPinMessages: { type: Boolean, default: true },
      canAddMembers: { type: Boolean, default: true },
      canEmbedLinks: { type: Boolean, default: true },
      canCreatePolls: { type: Boolean, default: true },
      canChangeChatInfo: { type: Boolean, default: false },
      exceptions: [memberExceptionSchema],
    },
    settings: {
      isPublic: { type: Boolean, default: true },
      inviteLink: { type: String },
      slowModeSeconds: { type: Number, default: 0 },
      maxMembers: { type: Number, default: 200000 },
      broadcastOnlyAdmins: { type: Boolean, default: false },
      topicsEnabled: { type: Boolean, default: false },
      defaultViewMode: { type: String, enum: ["topic", "message"], default: "message" },
      autoOwnershipTransfer: {
        enabled: { type: Boolean, default: false },
        designatedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        inactivityDays: { type: Number, default: 7 },
      },
      boosts: {
        level: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
      },
      liveStream: {
        isLive: { type: Boolean, default: false },
        startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        startedAt: { type: Date },
        raisedHands: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      miniApps: [
        {
          name: { type: String, trim: true },
          url: { type: String, trim: true },
          enabled: { type: Boolean, default: true },
        },
      ],
    },
    topics: [groupTopicSchema],
  },
  { timestamps: true },
);
module.exports = mongoose.model("Group", groupSchema);
