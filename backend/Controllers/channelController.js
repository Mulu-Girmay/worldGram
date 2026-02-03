const Channel = require("../Models/Channel");
exports.addChannel = async (req, res) => {
  let { name, userName, description, channelPhoto } = req.body;
  try {
    const newChannel = new Channel({
      basicInfo: {
        name: name,
        userName: userName,
        description: description,
        channelPhoto: channelPhoto,
      },
      ownership: {
        ownerId: req.userId, // Set from auth middleware
        admins: [req.userId],
      },
      audience: {
        subscribers: [],
        subscriberCount: 0,
      },
    });
    await newChannel.save();
    res.json({
      message: "Channel created successfully",
      channelId: newChannel._id,
    });
  } catch (error) {
    console.error("Channel creation error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Username already exists" });
    }
    return res.status(500).json({ error: "Failed to create channel" });
  }
};
exports.updateChannel = (req, res) => {
  let { channelId, name } = req.body;
};
