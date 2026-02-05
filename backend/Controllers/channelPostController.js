const User = require("../Models/User");
const Channel = require("../Models/Channel");
const ChannelPost = require("../Models/ChannelPost");

exports.addPost = async (req, res) => {
  try {
    let { text } = req.body;
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
      media: req.file ? req.file.filename : null,
    });
    await newPost.save();

    res.json({
      message: "post created successfully",
    });
  } catch (error) {
    res.status(401).send("post creation error:", error);
  }
};
exports.editPost = async (req, res) => {
  try {
    const { text, isPinned } = req.body;
    const userId = req.userId;
    const { channelId, postId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }

    const post = await ChannelPost.findById(postId);
    if (!post) {
      return res.status(404).json({ err: "Post not found" });
    }

    if (post.channelId.toString() !== channelId) {
      return res.status(403).json({ err: "You are in the wrong channel" });
    }

    const isAdmin = channel.ownership.admins
      .map((id) => id.toString())
      .includes(userId);

    if (!isAdmin) {
      return res.status(403).json({ err: "You are not admin here" });
    }

    await ChannelPost.findByIdAndUpdate(
      postId,
      {
        text: text ?? post.text,
        media: req.file ? req.file.filename : post.media,
        isPinned: isPinned ?? post.isPinned,
      },
      { new: true },
    );

    res.status(200).json({ message: "Post edited successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};
exports.reactToPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { channelId, postId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ err: "Emoji is required" });
    }

    const post = await ChannelPost.findOne({
      _id: postId,
      channelId,
    });

    if (!post) {
      return res.status(404).json({ err: "Post not found" });
    }

    // Find if user has reacted anywhere
    let previousReaction = null;

    for (const reaction of post.reactions) {
      if (reaction.reactors.map((id) => id.toString()).includes(userId)) {
        previousReaction = reaction;
        break;
      }
    }

    // 🟡 User clicked same emoji → REMOVE reaction
    if (previousReaction && previousReaction.emoji === emoji) {
      await ChannelPost.updateOne(
        { _id: postId, "reactions.emoji": emoji },
        {
          $pull: { "reactions.$.reactors": userId },
          $inc: { "reactions.$.count": -1 },
        },
      );

      return res.json({ message: "Reaction removed" });
    }

    if (previousReaction) {
      await ChannelPost.updateOne(
        { _id: postId, "reactions.emoji": previousReaction.emoji },
        {
          $pull: { "reactions.$.reactors": userId },
          $inc: { "reactions.$.count": -1 },
        },
      );
    }

    // 🟢 Add new reaction
    const emojiExists = post.reactions.some((r) => r.emoji === emoji);

    if (emojiExists) {
      await ChannelPost.updateOne(
        { _id: postId, "reactions.emoji": emoji },
        {
          $addToSet: { "reactions.$.reactors": userId },
          $inc: { "reactions.$.count": 1 },
        },
      );
    } else {
      await ChannelPost.updateOne(
        { _id: postId },
        {
          $push: {
            reactions: {
              emoji,
              count: 1,
              reactors: [userId],
            },
          },
        },
      );
    }

    res.json({ message: "Reaction updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};
exports.addViewToPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { channelId, postId } = req.params;

    const post = await ChannelPost.findOne({
      _id: postId,
      channelId,
    });

    if (!post) {
      return res.status(404).json({ err: "Post not found" });
    }

    const viewers = post.views?.[0]?.viewers || [];

    // already viewed → do nothing
    if (viewers.map((id) => id.toString()).includes(userId)) {
      return res.status(200).json({ message: "View already counted" });
    }

    // first view
    await ChannelPost.updateOne(
      { _id: postId },
      {
        $inc: { "views.0.viewNumber": 1 },
        $addToSet: { "views.0.viewers": userId },
      },
    );

    res.json({ message: "View registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.forwardPost = async (req, res) => {};
