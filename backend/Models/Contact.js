const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nameOverride: {
      type: String,
    },
    isBlocked: {
      type: Boolean,
    },
    isFavorite: {
      type: Boolean,
    },
    phone: {
      type: String,
    },
  },
  { timestamps: true },
);

ContactSchema.index({ ownerUserId: 1, contactUserId: 1 });
ContactSchema.index({ ownerUserId: 1, updatedAt: -1 });

module.exports = mongoose.model("Contact", ContactSchema);
