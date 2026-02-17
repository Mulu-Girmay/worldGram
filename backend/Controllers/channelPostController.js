const Channel = require("../Models/Channel");
const ChannelPost = require("../Models/ChannelPost");
const ChannelAction = require("../Models/ChannelAction");
const mongoose = require("mongoose");
const { reactToEntity } = require("../utils/reaction");
const { addViewToEntity } = require("../utils/view");
const { forwardEntity } = require("../utils/forward");
const Chat = require("../Models/Chat");

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const asStringIds = (arr = []) => arr.map((id) => id?.toString?.() || String(id));
const POST_AUTHOR_SELECT =
  "_id identity.firstName identity.lastName identity.username";

const withPostAuthors = (query) =>
  query
    .populate("authorId", POST_AUTHOR_SELECT)
    .populate("comments.authorId", POST_AUTHOR_SELECT)
    .populate("comments.replies.authorId", POST_AUTHOR_SELECT);

const isChannelOwner = (channel, userId) =>
  Boolean(channel?.ownership?.ownerId?.toString?.() === String(userId));

const isChannelAdmin = (channel, userId) =>
  asStringIds(channel?.ownership?.admins || []).includes(String(userId));

const isOwnerOrAdmin = (channel, userId) =>
  isChannelOwner(channel, userId) || isChannelAdmin(channel, userId);

const hasAdminPermission = (channel, userId, key) => {
  if (isChannelOwner(channel, userId)) return true;
  if (!isChannelAdmin(channel, userId)) return false;
  const list = channel?.ownership?.adminPermissions || [];
  const found = list.find(
    (entry) => entry?.userId?.toString?.() === String(userId),
  );
  if (!found) return true;
  return Boolean(found?.permissions?.[key]);
};

const canViewChannel = (channel, userId) => {
  const isSubscriber = asStringIds(channel?.audience?.subscribers || []).includes(
    String(userId),
  );
  return channel?.settings?.isPublic || isSubscriber || isOwnerOrAdmin(channel, userId);
};

const getPostDeepLink = (channel, postId) => {
  const publicBase = process.env.APP_PUBLIC_URL || "http://localhost:5173";
  const username = channel?.basicInfo?.userName;
  if (username) {
    return `https://t.me/${username}/${postId}`;
  }
  return `${publicBase}/home?channel=${channel?._id}&post=${postId}`;
};

const logChannelAction = async ({
  channelId,
  actorId,
  action,
  targetType,
  targetId,
  meta,
}) => {
  try {
    await ChannelAction.create({
      channelId,
      actorId,
      action,
      targetType: targetType || null,
      targetId: targetId || null,
      meta: meta || null,
    });
  } catch (error) {
    console.error("channel action log error:", error?.message || error);
  }
};

exports.addPost = async (req, res) => {
  try {
    const { text, signatureTitle, isSilent } = req.body;
    const userId = req.userId;
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);

    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!hasAdminPermission(channel, userId, "canPostMessages")) {
      return res
        .status(403)
        .json({ err: "You are not authorized to post in this channel" });
    }

    const media =
      req.file && req.file.filename
        ? [
            {
              url: req.file.filename,
              type: req.file.mimetype || "file",
              size: req.file.size || 0,
            },
          ]
        : [];

    const newPost = new ChannelPost({
      channelId,
      authorId: userId,
      text: String(text || "").trim() || null,
      media,
      isSilent: Boolean(isSilent),
      authorSignature: {
        show: Boolean(channel?.settings?.showAuthorSignatures),
        title: signatureTitle ? String(signatureTitle).trim() : null,
      },
    });
    newPost.deepLink = getPostDeepLink(channel, newPost._id);
    await newPost.save();
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "post_created",
      targetType: "post",
      targetId: newPost._id,
      meta: { isSilent: Boolean(isSilent) },
    });

    res.json({
      message: "post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Post creation failed" });
  }
};

exports.editPost = async (req, res) => {
  try {
    const { text, isPinned, isSilent, signatureTitle } = req.body;
    const userId = req.userId;
    const { channelId, postId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    const post = await ChannelPost.findById(postId);
    if (!post) return res.status(404).json({ err: "Post not found" });
    if (post.channelId.toString() !== channelId) {
      return res.status(403).json({ err: "You are in the wrong channel" });
    }

    const canEditOwn = post.authorId?.toString?.() === String(userId);
    const canEditAny = hasAdminPermission(channel, userId, "canEditMessagesOfOthers");
    if (!canEditOwn && !canEditAny) {
      return res.status(403).json({ err: "You are not allowed to edit this post" });
    }

    const mediaUpdate =
      req.file && req.file.filename
        ? [
            {
              url: req.file.filename,
              type: req.file.mimetype || "file",
              size: req.file.size || 0,
            },
          ]
        : post.media;

    const updatedPost = await ChannelPost.findByIdAndUpdate(
      postId,
      {
        text: text ?? post.text,
        media: mediaUpdate,
        isPinned: isPinned ?? post.isPinned,
        isSilent: isSilent ?? post.isSilent,
        authorSignature: {
          show: Boolean(channel?.settings?.showAuthorSignatures),
          title: signatureTitle ?? post?.authorSignature?.title ?? null,
        },
      },
      { new: true },
    );
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "post_edited",
      targetType: "post",
      targetId: postId,
    });

    res.status(200).json({ message: "Post edited successfully", post: updatedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to react to this post" });
    }

    const emoji = String(req.body?.emoji || "").trim();
    if (!emoji) return res.status(400).json({ err: "Emoji is required" });

    const allowed = channel?.settings?.allowedReactions || [];
    if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(emoji)) {
      return res.status(400).json({ err: "Reaction is not allowed in this channel" });
    }

    const result = await reactToEntity({
      Model: ChannelPost,
      findQuery: { _id: req.params.postId, channelId: req.params.channelId },
      userId: req.userId,
      emoji,
      reactionsPath: "reactions",
    });

    if (result.status === 200) {
      const updatedPost = await ChannelPost.findOne({
        _id: req.params.postId,
        channelId: req.params.channelId,
      }).select("_id channelId reactions");

      if (updatedPost) {
        const io = req.app.get("io");
        io.to(`channel:${req.params.channelId}`).emit(
          "channel-post-reaction-updated",
          {
            channelId: req.params.channelId,
            postId: updatedPost._id,
            reactions: updatedPost.reactions || [],
          },
        );
      }
    }

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.addViewToPost = async (req, res) => {
  try {
    const result = await addViewToEntity({
      Model: ChannelPost,
      findQuery: { _id: req.params.postId, channelId: req.params.channelId },
      userId: req.userId,
      viewersPath: "viewedBy",
      notFoundMessage: "Post not found",
    });

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

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, userId)) {
      return res.status(403).json({ err: "Not allowed to comment" });
    }
    if (!channel?.settings?.allowComments || !channel?.settings?.discussionGroupId) {
      return res.status(403).json({
        err: "Comments are available only when discussion is enabled",
      });
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
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "post_comment_added",
      targetType: "post",
      targetId: postId,
    });

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

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, userId)) {
      return res.status(403).json({ err: "Not allowed to reply" });
    }
    if (!channel?.settings?.allowComments || !channel?.settings?.discussionGroupId) {
      return res.status(403).json({
        err: "Replies are available only when discussion is enabled",
      });
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
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "post_comment_replied",
      targetType: "post",
      targetId: postId,
    });

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
    const hasText = Boolean(forwardedPost.text);
    const hasMedia = Array.isArray(forwardedPost.media) && forwardedPost.media.length > 0;
    if (!hasText && !hasMedia) {
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
        media: forwardedPost.media || [],
        authorId: req.userId,
        channelId: id,
      },
    });
    await logChannelAction({
      channelId: req.params.channelId,
      actorId: req.userId,
      action: "post_forwarded",
      targetType: "post",
      targetId: req.params.postId,
      meta: { destinationType: type, destinationId: id },
    });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
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

    res.json({
      items: posts,
      nextCursor,
      channelSettings: {
        allowComments: Boolean(channel?.settings?.allowComments),
        hasDiscussionGroup: Boolean(channel?.settings?.discussionGroupId),
        allowedReactions: channel?.settings?.allowedReactions || [],
        contentProtection: Boolean(channel?.settings?.contentProtection),
      },
    });
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

    const post = await ChannelPost.findById(postId);
    if (!post) return res.status(404).json({ err: "Post not found" });
    if (post.channelId.toString() !== channelId) {
      return res.status(400).json({ err: "Post not in this channel" });
    }

    const canDeleteOwn = post.authorId?.toString?.() === String(req.userId);
    const canDeleteAny = hasAdminPermission(channel, req.userId, "canDeleteMessages");
    if (!canDeleteOwn && !canDeleteAny) {
      return res.status(403).json({ err: "You are not allowed to delete this post" });
    }

    await ChannelPost.findByIdAndDelete(postId);
    await logChannelAction({
      channelId,
      actorId: req.userId,
      action: "post_deleted",
      targetType: "post",
      targetId: postId,
    });
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
    if (!isOwnerOrAdmin(channel, req.userId)) {
      return res.status(403).json({ err: "You are not admin here" });
    }

    const post = await ChannelPost.findByIdAndUpdate(
      postId,
      { isPinned: true },
      { new: true },
    );
    if (!post) return res.status(404).json({ err: "Post not found" });
    await logChannelAction({
      channelId,
      actorId: req.userId,
      action: "post_pinned",
      targetType: "post",
      targetId: postId,
    });

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
    if (!isOwnerOrAdmin(channel, req.userId)) {
      return res.status(403).json({ err: "You are not admin here" });
    }

    const post = await ChannelPost.findByIdAndUpdate(
      postId,
      { isPinned: false },
      { new: true },
    );
    if (!post) return res.status(404).json({ err: "Post not found" });
    await logChannelAction({
      channelId,
      actorId: req.userId,
      action: "post_unpinned",
      targetType: "post",
      targetId: postId,
    });

    res.json({ message: "Post unpinned", post });
  } catch (err) {
    res.status(500).json({ err: "Failed to unpin post" });
  }
};
