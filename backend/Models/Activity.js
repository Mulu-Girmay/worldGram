const mongoose = require("mongoose");
const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastSeenAt: { type: Date, default: Date.now },
    activeChatId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    device: { type: String },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Activity", activitySchema);
