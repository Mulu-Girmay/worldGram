const Activity = require("../Models/Activity");

exports.updateActivity = async (req, res) => {
  try {
    const { activeChatId, device } = req.body;
    const activity = await Activity.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        lastSeenAt: new Date(),
        activeChatId: activeChatId || null,
        device: device || null,
      },
      { upsert: true, new: true },
    );
    res.json({ message: "Activity updated", activity });
  } catch (err) {
    res.status(500).json({ err: "Failed to update activity" });
  }
};

exports.getActivityByUser = async (req, res) => {
  try {
    const activity = await Activity.findOne({ userId: req.params.userId });
    if (!activity) {
      return res.status(404).json({ err: "Activity not found" });
    }
    res.json(activity);
  } catch (err) {
    res.status(500).json({ err: "Failed to get activity" });
  }
};
