const User = require("../Models/User");
const Channel = require("../Models/Channel");
const ChannelPost = require("../Models/ChannelPost");
const mongoose = require("mongoose");
const { reactToEntity } = require("../utils/reaction");
const { addViewToEntity } = require("../utils/view");
const { forwardEntity } = require("../utils/forward");
const Chat = require("../Models/Chat");

exports.addPost = async (req, res) => {
  try {
    let { text } = req.body;
    let userId = req.userId;
    let channelId = req.params.id;
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }

    const isOwner = channel.ownership?.ownerId
      ? channel.ownership.ownerId.toString() === userId
      : false;
    const isAdmin = channel.ownership.admins
      .map((id) => id.toString())
      .includes(userId);

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ err: "You are not authorized to post in this channel" });
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
    const isOwner = channel.ownership?.ownerId
      ? channel.ownership.ownerId.toString() === userId
      : false;

    if (!isAdmin && !isOwner) {
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
    const result = await reactToEntity({
      Model: ChannelPost,
      findQuery: { _id: req.params.postId, channelId: req.params.channelId },
      userId: req.userId,
      emoji: req.body.emoji,
      reactionsPath: "reactions",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.addViewToPost = async (req, res) => {
  try {
    console.log("addViewToPost called", {
      params: req.params,
      userId: req.userId,
    });
    const result = await addViewToEntity({
      Model: ChannelPost,
      findQuery: { _id: req.params.postId, channelId: req.params.channelId },
      userId: req.userId,
      viewersPath: "viewedBy",
      countPath: "views.0.viewNumber",
      notFoundMessage: "Post not found",
    });
    console.log("addViewToPost result", result);

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.addCommentToPost = async (req, res) => {
  try {
    const { channelId, postId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ err: "Comment text required" });
    }

    const post = await ChannelPost.findOne({ _id: postId, channelId });
    if (!post) return res.status(404).json({ err: "Post not found" });

    const comment = {
      authorId: userId,
      text: text.trim(),
      createdAt: new Date(),
      replies: [],
    };

    await ChannelPost.updateOne(
      { _id: post._id },
      { $push: { comments: comment } },
    );

    return res.status(201).json({ message: "Comment added" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: err.message });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const { channelId, postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ err: "Reply text required" });
    }

    const post = await ChannelPost.findOne({ _id: postId, channelId });
    if (!post) return res.status(404).json({ err: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ err: "Comment not found" });

    const reply = {
      authorId: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    await ChannelPost.updateOne(
      { _id: post._id, "comments._id": commentId },
      { $push: { "comments.$.replies": reply } },
    );

    return res.status(201).json({ message: "Reply added" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: err.message });
  }
};

exports.forwardPost = async (req, res) => {
  try {
    const { type, id } = req.body;
    if (!type || !id) {
      return res.status(400).json({ err: "Destination type and id required" });
    }

    let targetModel;
    if (type === "channel") {
      targetModel = ChannelPost;
    } else if (type === "chat") {
      targetModel = Chat;
    } else {
      return res.status(400).json({ err: "Invalid destination type" });
    }

    const forwardedPost = await ChannelPost.findById(req.params.postId);
    if (!forwardedPost) {
      return res.status(404).json({ err: "Post not found" });
    }

    if (!forwardedPost.text && !forwardedPost.media) {
      return res.status(400).json({ err: "Cannot forward empty post" });
    }

    const result = await forwardEntity({
      SourceModel: ChannelPost,
      TargetModel: targetModel,
      findQuery: { _id: req.params.postId, channelId: req.params.channelId },
      userId: req.userId,
      destination: { type, id },
      original: {
        channelId: req.params.channelId,
        postId: req.params.postId,
      },
      snapshot: {
        text: forwardedPost.text || null,
        media: forwardedPost.media || null,
        authorId: req.userId,
        channelId: id,
      },
    });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const POST_AUTHOR_SELECT =
  "_id identity.firstName identity.lastName identity.username";

const withPostAuthors = (query) =>
  query
    .populate("authorId", POST_AUTHOR_SELECT)
    .populate("comments.authorId", POST_AUTHOR_SELECT)
    .populate("comments.replies.authorId", POST_AUTHOR_SELECT);

const canViewChannel = (channel, userId) => {
  const isSubscriber = channel.audience.subscribers
    .map((id) => id.toString())
    .includes(userId);
  const isAdmin = channel.ownership.admins
    .map((id) => id.toString())
    .includes(userId);
  const isOwner = channel.ownership?.ownerId
    ? channel.ownership.ownerId.toString() === userId
    : false;
  return channel.settings.isPublic || isSubscriber || isAdmin || isOwner;
};

exports.getChannelPosts = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to view posts" });
    }

    const query = { channelId };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const posts = await withPostAuthors(
      ChannelPost.find(query).sort({ _id: -1 }).limit(limit),
    );
    const nextCursor =
      posts.length === limit ? posts[posts.length - 1]._id : null;

    res.json({ items: posts, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch posts" });
  }
};

exports.getChannelPostById = async (req, res) => {
  try {
    const { channelId, postId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to view post" });
    }

    const post = await withPostAuthors(ChannelPost.findById(postId));
    if (!post) return res.status(404).json({ err: "Post not found" });
    if (post.channelId.toString() !== channelId) {
      return res.status(400).json({ err: "Post not in this channel" });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch post" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { channelId, postId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    const isAdmin = channel.ownership.admins
      .map((id) => id.toString())
      .includes(req.userId);
    const isOwner = channel.ownership?.ownerId
      ? channel.ownership.ownerId.toString() === req.userId
      : false;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ err: "You are not admin here" });
    }

    const post = await ChannelPost.findById(postId);
    if (!post) return res.status(404).json({ err: "Post not found" });
    if (post.channelId.toString() !== channelId) {
      return res.status(400).json({ err: "Post not in this channel" });
    }

    await ChannelPost.findByIdAndDelete(postId);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ err: "Failed to delete post" });
  }
};

exports.pinPost = async (req, res) => {
  try {
    const { channelId, postId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    const isAdmin = channel.ownership.admins
      .map((id) => id.toString())
      .includes(req.userId);
    const isOwner = channel.ownership?.ownerId
      ? channel.ownership.ownerId.toString() === req.userId
      : false;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ err: "You are not admin here" });
    }

    const post = await ChannelPost.findByIdAndUpdate(
      postId,
      { isPinned: true },
      { new: true },
    );
    if (!post) return res.status(404).json({ err: "Post not found" });

    res.json({ message: "Post pinned", post });
  } catch (err) {
    res.status(500).json({ err: "Failed to pin post" });
  }
};

exports.unpinPost = async (req, res) => {
  try {
    const { channelId, postId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    const isAdmin = channel.ownership.admins
      .map((id) => id.toString())
      .includes(req.userId);
    const isOwner = channel.ownership?.ownerId
      ? channel.ownership.ownerId.toString() === req.userId
      : false;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ err: "You are not admin here" });
    }

    const post = await ChannelPost.findByIdAndUpdate(
      postId,
      { isPinned: false },
      { new: true },
    );
    if (!post) return res.status(404).json({ err: "Post not found" });

    res.json({ message: "Post unpinned", post });
  } catch (err) {
    res.status(500).json({ err: "Failed to unpin post" });
  }
};
