const Channel = require("../Models/Channel");
const User = require("../Models/User");
const ChannelPost = require("../Models/ChannelPost");
const ChannelAction = require("../Models/ChannelAction");
const mongoose = require("mongoose");

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const asStringIds = (arr = []) => arr.map((id) => id?.toString?.() || String(id));

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

exports.addChannel = async (req, res) => {
  const { name, userName, description } = req.body;
  try {
    const newChannel = new Channel({
      basicInfo: {
        name,
        userName,
        description,
        channelPhoto: (req.file && req.file.filename) || null,
      },
      ownership: {
        ownerId: req.userId,
        admins: [req.userId],
      },
      audience: {
        subscribers: [],
        subscriberCount: 0,
        mutedSubscribers: [],
        pendingJoinRequests: [],
      },
      settings: {
        isPublic: true,
        allowJoinRequests: false,
        allowComments: true,
        showAuthorSignatures: false,
        contentProtection: false,
        allowSuggestedPosts: false,
        allowedReactions: [],
      },
    });
    await newChannel.save();
    await logChannelAction({
      channelId: newChannel._id,
      actorId: req.userId,
      action: "channel_created",
    });
    res.json({
      message: "Channel created successfully",
      channelId: newChannel._id,
    });
  } catch (error) {
    console.error("Channel creation error:", error, {
      body: req.body,
      file: req.file,
    });
    if (error.code === 11000) {
      return res.status(400).json({ error: "Username already exists" });
    }
    return res.status(500).json({ error: "Failed to create channel" });
  }
};

exports.updateChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const userId = req.userId;
    const { updatedData } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }

    if (!isOwnerOrAdmin(channel, userId)) {
      return res
        .status(401)
        .json({ err: "You are not authorized to update this channel" });
    }

    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      { $set: updatedData || {} },
      { new: true, runValidators: true },
    );

    await logChannelAction({
      channelId,
      actorId: userId,
      action: "channel_updated",
      meta: { fields: Object.keys(updatedData || {}) },
    });

    res.status(200).json({
      message: "Channel successfully updated",
      updatedChannel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Channel failed to update" });
  }
};

exports.deleteChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }
    if (!isChannelOwner(channel, userId)) {
      return res
        .status(401)
        .json({ err: "You are not authorized to delete this channel" });
    }

    await Channel.findByIdAndDelete(channelId);
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "channel_deleted",
    });
    res.status(200).json({
      message: "Channel successfully deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Channel failed to delete" });
  }
};

exports.addAdmin = async (req, res) => {
  try {
    const { newAdminUsername } = req.body;
    const userId = req.userId;
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);

    if (!newAdminUsername) {
      return res.status(400).json({
        err: "newAdminUsername is required",
      });
    }
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }
    if (
      !isChannelOwner(channel, userId) &&
      !hasAdminPermission(channel, userId, "canAddAdmins")
    ) {
      return res
        .status(403)
        .json({ err: "You are not authorized to add admins in this channel" });
    }
    const adminExists = await User.findOne({
      "identity.username": newAdminUsername,
    });
    if (!adminExists) {
      return res.status(404).json({ err: "admin username not found" });
    }
    const newAdminId = adminExists._id.toString();
    const admins = asStringIds(channel.ownership.admins || []);

    if (admins.includes(newAdminId)) {
      return res.status(409).json({
        err: "User is already an admin",
      });
    }

    channel.ownership.admins.push(newAdminId);
    await channel.save();
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "admin_added",
      targetType: "user",
      targetId: newAdminId,
      meta: { username: newAdminUsername },
    });

    res.status(200).json({
      message: "admin successfully added",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: " failed to add admin" });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { adminUsername } = req.body;
    const userId = req.userId;
    const channelId = req.params.id;

    if (!adminUsername) {
      return res.status(400).json({ err: "adminUsername is required" });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }
    if (
      !isChannelOwner(channel, userId) &&
      !hasAdminPermission(channel, userId, "canAddAdmins")
    ) {
      return res.status(403).json({
        err: "You are not authorized to remove admins from this channel",
      });
    }

    const adminToRemove = await User.findOne({
      "identity.username": adminUsername,
    });
    if (!adminToRemove) {
      return res.status(404).json({ err: "Admin username not found" });
    }

    const adminToRemoveId = adminToRemove._id.toString();
    const admins = asStringIds(channel.ownership.admins || []);

    if (!admins.includes(adminToRemoveId)) {
      return res.status(409).json({
        err: "This user is not an admin",
      });
    }

    const ownerIdStr = channel.ownership?.ownerId
      ? channel.ownership.ownerId.toString()
      : null;
    if (ownerIdStr && adminToRemoveId === ownerIdStr) {
      return res.status(403).json({ err: "Cannot remove channel owner" });
    }
    if (adminToRemoveId === userId) {
      return res.status(403).json({
        err: "You cannot remove yourself as admin",
      });
    }

    channel.ownership.admins = channel.ownership.admins.filter(
      (id) => id.toString() !== adminToRemoveId,
    );
    channel.ownership.adminPermissions = (
      channel.ownership.adminPermissions || []
    ).filter((entry) => entry?.userId?.toString?.() !== adminToRemoveId);

    await channel.save();
    await logChannelAction({
      channelId,
      actorId: userId,
      action: "admin_removed",
      targetType: "user",
      targetId: adminToRemoveId,
      meta: { username: adminUsername },
    });

    res.status(200).json({
      message: "Admin successfully removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Failed to remove admin" });
  }
};

exports.updateAdminPermissions = async (req, res) => {
  try {
    const channelId = req.params.id;
    const { adminUsername, permissions } = req.body || {};
    if (!adminUsername || typeof permissions !== "object" || !permissions) {
      return res.status(400).json({
        err: "adminUsername and permissions object are required",
      });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!isChannelOwner(channel, req.userId)) {
      return res
        .status(403)
        .json({ err: "Only channel owner can manage admin permissions" });
    }

    const adminUser = await User.findOne({ "identity.username": adminUsername });
    if (!adminUser) return res.status(404).json({ err: "Admin user not found" });
    const adminId = adminUser._id.toString();
    if (!isChannelAdmin(channel, adminId)) {
      return res.status(400).json({ err: "User is not a channel admin" });
    }

    const list = channel.ownership.adminPermissions || [];
    const idx = list.findIndex(
      (entry) => entry?.userId?.toString?.() === adminId,
    );
    const merged = {
      canPostMessages: permissions.canPostMessages !== false,
      canEditMessagesOfOthers: permissions.canEditMessagesOfOthers !== false,
      canDeleteMessages: permissions.canDeleteMessages !== false,
      canManageStories: Boolean(permissions.canManageStories),
      canManageLivestreams: Boolean(permissions.canManageLivestreams),
      canAddAdmins: Boolean(permissions.canAddAdmins),
    };

    if (idx >= 0) {
      list[idx].permissions = merged;
    } else {
      list.push({ userId: adminId, permissions: merged });
    }
    channel.ownership.adminPermissions = list;
    await channel.save();
    await logChannelAction({
      channelId,
      actorId: req.userId,
      action: "admin_permissions_updated",
      targetType: "user",
      targetId: adminId,
      meta: { username: adminUsername, permissions: merged },
    });

    return res.json({ message: "Admin permissions updated" });
  } catch (error) {
    return res.status(500).json({ err: "Failed to update admin permissions" });
  }
};

exports.getChannelRecentActions = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!isOwnerOrAdmin(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to view recent actions" });
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const limit = parseLimit(req.query.limit, 50, 100);
    const actions = await ChannelAction.find({
      channelId: req.params.id,
      createdAt: { $gte: since },
    })
      .sort({ _id: -1 })
      .limit(limit)
      .populate(
        "actorId",
        "_id identity.firstName identity.lastName identity.username",
      );

    return res.json({ items: actions });
  } catch (error) {
    return res.status(500).json({ err: "Failed to fetch recent actions" });
  }
};

exports.getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to view channel" });
    }

    const muted = asStringIds(channel?.audience?.mutedSubscribers || []).includes(
      String(req.userId),
    );
    const payload = channel.toObject();
    payload.viewerState = {
      isMuted: muted,
      hasPendingJoinRequest: asStringIds(
        channel?.audience?.pendingJoinRequests || [],
      ).includes(String(req.userId)),
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch channel" });
  }
};

exports.listChannels = async (req, res) => {
  try {
    const { cursor, q } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = {};
    if (q) {
      query["basicInfo.name"] = { $regex: q, $options: "i" };
    }
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const channels = await Channel.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor =
      channels.length === limit ? channels[channels.length - 1]._id : null;

    res.json({ data: { items: channels, nextCursor } });
  } catch (error) {
    res.status(500).json({ err: "Failed to list channels" });
  }
};

exports.listMyChannels = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = {
      $or: [
        { "ownership.ownerId": req.userId },
        { "ownership.admins": req.userId },
      ],
    };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const channels = await Channel.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor =
      channels.length === limit ? channels[channels.length - 1]._id : null;

    res.json({ items: channels, nextCursor });
  } catch (error) {
    res.status(500).json({ err: "Failed to list channels" });
  }
};

exports.subscribeChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    const subscribers = asStringIds(channel.audience.subscribers || []);
    if (subscribers.includes(req.userId)) {
      return res.status(409).json({ err: "Already subscribed" });
    }

    if (channel?.settings?.allowJoinRequests) {
      const pending = asStringIds(channel?.audience?.pendingJoinRequests || []);
      if (pending.includes(req.userId)) {
        return res.status(409).json({ err: "Join request already pending" });
      }
      channel.audience.pendingJoinRequests =
        channel.audience.pendingJoinRequests || [];
      channel.audience.pendingJoinRequests.push(req.userId);
      await channel.save();
      await logChannelAction({
        channelId: channel._id,
        actorId: req.userId,
        action: "join_request_created",
      });
      return res.json({ message: "Join request sent" });
    }

    channel.audience.subscribers.push(req.userId);
    channel.audience.subscriberCount = channel.audience.subscribers.length;
    await channel.save();
    await logChannelAction({
      channelId: channel._id,
      actorId: req.userId,
      action: "subscriber_joined",
    });

    res.json({ message: "Subscribed" });
  } catch (error) {
    res.status(500).json({ err: "Failed to subscribe" });
  }
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!isOwnerOrAdmin(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to approve join requests" });
    }
    const requestUserId = req.params.requestUserId;
    const pending = asStringIds(channel?.audience?.pendingJoinRequests || []);
    if (!pending.includes(String(requestUserId))) {
      return res.status(404).json({ err: "Join request not found" });
    }
    channel.audience.pendingJoinRequests =
      channel.audience.pendingJoinRequests.filter(
        (id) => id.toString() !== String(requestUserId),
      );
    if (
      !asStringIds(channel.audience.subscribers || []).includes(
        String(requestUserId),
      )
    ) {
      channel.audience.subscribers.push(requestUserId);
    }
    channel.audience.subscriberCount = channel.audience.subscribers.length;
    await channel.save();
    await logChannelAction({
      channelId: channel._id,
      actorId: req.userId,
      action: "join_request_approved",
      targetType: "user",
      targetId: requestUserId,
    });
    return res.json({ message: "Join request approved" });
  } catch (error) {
    return res.status(500).json({ err: "Failed to approve join request" });
  }
};

exports.unsubscribeChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    channel.audience.subscribers = (channel.audience.subscribers || []).filter(
      (id) => id.toString() !== req.userId,
    );
    channel.audience.mutedSubscribers = (
      channel.audience.mutedSubscribers || []
    ).filter((id) => id.toString() !== req.userId);
    channel.audience.subscriberCount = channel.audience.subscribers.length;
    await channel.save();
    await logChannelAction({
      channelId: channel._id,
      actorId: req.userId,
      action: "subscriber_left",
    });

    res.json({ message: "Unsubscribed" });
  } catch (error) {
    res.status(500).json({ err: "Failed to unsubscribe" });
  }
};

exports.muteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to mute this channel" });
    }

    const muted = asStringIds(channel?.audience?.mutedSubscribers || []);
    if (!muted.includes(req.userId)) {
      channel.audience.mutedSubscribers = channel.audience.mutedSubscribers || [];
      channel.audience.mutedSubscribers.push(req.userId);
      await channel.save();
      await logChannelAction({
        channelId: channel._id,
        actorId: req.userId,
        action: "channel_muted",
      });
    }
    return res.json({ message: "Channel muted" });
  } catch (error) {
    return res.status(500).json({ err: "Failed to mute channel" });
  }
};

exports.unmuteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to unmute this channel" });
    }

    channel.audience.mutedSubscribers = (
      channel.audience.mutedSubscribers || []
    ).filter((id) => id.toString() !== req.userId);
    await channel.save();
    await logChannelAction({
      channelId: channel._id,
      actorId: req.userId,
      action: "channel_unmuted",
    });
    return res.json({ message: "Channel unmuted" });
  } catch (error) {
    return res.status(500).json({ err: "Failed to unmute channel" });
  }
};

exports.suggestPost = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!channel?.settings?.allowSuggestedPosts) {
      return res.status(403).json({ err: "Suggested posts are disabled" });
    }
    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to suggest a post" });
    }
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ err: "Post suggestion text required" });

    await logChannelAction({
      channelId: channel._id,
      actorId: req.userId,
      action: "post_suggested",
      meta: { text },
    });
    return res.status(201).json({ message: "Post suggestion sent to admins" });
  } catch (error) {
    return res.status(500).json({ err: "Failed to suggest post" });
  }
};

exports.getChannelAnalytics = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });
    if (!isOwnerOrAdmin(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to view analytics" });
    }

    const subscriberCount = Number(channel?.audience?.subscriberCount || 0);
    if (subscriberCount < 50) {
      return res.status(403).json({
        err: "Detailed analytics are available after 50 subscribers",
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await ChannelPost.find({
      channelId: channel._id,
      createdAt: { $gte: sevenDaysAgo },
    }).select("views.viewNumber reactions forward.count createdAt");
    const totals = posts.reduce(
      (acc, post) => {
        acc.postCount += 1;
        acc.views += Number(post?.views?.viewNumber || 0);
        acc.forwards += Number(post?.forward?.count || 0);
        acc.reactions += (post?.reactions || []).reduce(
          (sum, item) => sum + Number(item?.count || 0),
          0,
        );
        return acc;
      },
      { postCount: 0, views: 0, forwards: 0, reactions: 0 },
    );

    return res.json({
      growth: { subscribers: subscriberCount },
      interactions: totals,
      windowDays: 7,
    });
  } catch (error) {
    return res.status(500).json({ err: "Failed to fetch channel analytics" });
  }
};

exports.getChannelUnreadCount = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    if (!canViewChannel(channel, req.userId)) {
      return res.status(403).json({ err: "Not allowed to view channel" });
    }

    const unreadCount = await ChannelPost.countDocuments({
      channelId: req.params.id,
      viewedBy: { $ne: req.userId },
      authorId: { $ne: req.userId },
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch unread count" });
  }
};
