const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    identity: {
      phoneNumber: { type: Number, required: true, unique: true },
      password: { type: String, required: true },
      username: { type: String, unique: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      Bio: { type: String, default: "" },
      profileUrl: { type: String },
    },
    AccountStatus: {
      isVerified: { type: Boolean, default: false },
      isBot: { type: Boolean, default: false },
      isDeleted: { type: Boolean, default: false },
      lastSeenAt: { type: Date },
      onlineStatus: {
        type: String,
        enum: ["online", "offline", "recently"],
        default: "offline",
      },
    },
    privacySettings: {
      privacyLastSeen: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "contacts",
      },
      privacyProfilePhoto: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "contacts",
      },
      privacyPhoneNumber: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "contacts",
      },
      privacyForwardedMessage: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "contacts",
      },
    },
    security: {
      passwordHash: { type: String },
      twoFactorEnabled: { type: Boolean, default: false },
      blockedUsers: { type: Array },
    },
    Relations: {
      contacts: { type: Array },
      SavedMessagesChatId: { type: Array },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
