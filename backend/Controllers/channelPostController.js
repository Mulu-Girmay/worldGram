const User = require("../Models/User");
const Channel = require("../Models/Channel");
const ChannelPost = require("../Models/ChannelPost");

exports.addPost = async (req, res) => {
  try {
    let { text } = req.body;
    let { media } = req.file;
    let userId = req.userId;
    let channelId = req.params.id;
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }

    let newPost = new ChannelPost({
      channelId: channelId,
      authorId: userId,
      text: text || null,
      media: media.filename,
    });
    await newPost.save();
    res.json({
      message: "post created successfully",
    });
  } catch (error) {
    res.status(401).send("post creation error:", error);
  }
};
