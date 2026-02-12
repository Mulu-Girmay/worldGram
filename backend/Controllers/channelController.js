const Channel = require("../Models/Channel");
const User = require("../Models/User");
const mongoose = require("mongoose");
exports.addChannel = async (req, res) => {
  let { name, userName, description } = req.body;
  try {
    const newChannel = new Channel({
      basicInfo: {
        name: name,
        userName: userName,
        description: description,
        channelPhoto: (req.file && req.file.filename) || null,
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
    const { updatedData } = req.body; // dynamic updates

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }

    const admins = channel.ownership.admins.map((id) => id.toString());

    if (!admins.includes(userId)) {
      return res
        .status(401)
        .json({ err: "You are not authorized to update this channel" });
    }

    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      { $set: updatedData },
      { new: true, runValidators: true },
    );

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
    const admins = channel.ownership.admins.map((id) => id.toString());

    if (!admins.includes(userId)) {
      return res
        .status(401)
        .json({ err: "You are not authorized to delete this channel" });
    }
    const deletedChannel = await Channel.findByIdAndDelete(channelId);
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
    let { newAdminUsername } = req.body;
    const userId = req.userId;

    let channelId = req.params.id;
    const channel = await Channel.findById(channelId);
    if (!newAdminUsername) {
      return res.status(400).json({
        err: "newAdminUsername is required",
      });
    }
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }
    const admins = channel.ownership.admins.map((id) => id.toString());

    if (!admins.includes(userId)) {
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

    if (admins.includes(newAdminId)) {
      return res.status(409).json({
        err: "User is already an admin",
      });
    }
    channel.ownership.admins.push(newAdminId);
    await channel.save();

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
    const { adminUsername } = req.body; // user to remove
    const userId = req.userId; // current user
    const channelId = req.params.id;

    // Validate input
    if (!adminUsername) {
      return res.status(400).json({ err: "adminUsername is required" });
    }

    // Find the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ err: "Channel not found" });
    }

    // Only existing admins can remove other admins
    const admins = channel.ownership.admins.map((id) => id.toString());
    if (!admins.includes(userId)) {
      return res.status(403).json({
        err: "You are not authorized to remove admins from this channel",
      });
    }

    // Find the admin user in the database
    const adminToRemove = await User.findOne({
      "identity.username": adminUsername,
    });
    if (!adminToRemove) {
      return res.status(404).json({ err: "Admin username not found" });
    }

    const adminToRemoveId = adminToRemove._id.toString();

    // Prevent removing someone who isn’t an admin
    if (!admins.includes(adminToRemoveId)) {
      return res.status(409).json({
        err: "This user is not an admin",
      });
    }

    // Optional: Prevent removing yourself
    if (adminToRemoveId === userId) {
      return res.status(403).json({
        err: "You cannot remove yourself as admin",
      });
    }

    // Remove admin using filter
    channel.ownership.admins = channel.ownership.admins.filter(
      (id) => id.toString() !== adminToRemoveId,
    );

    await channel.save();

    res.status(200).json({
      message: "Admin successfully removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Failed to remove admin" });
  }
};

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

exports.getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    const isSubscriber = channel.audience.subscribers
      .map((id) => id.toString())
      .includes(req.userId);
    const isAdmin = channel.ownership.admins
      .map((id) => id.toString())
      .includes(req.userId);

    if (!channel.settings.isPublic && !isSubscriber && !isAdmin) {
      return res.status(403).json({ err: "Not allowed to view channel" });
    }

    res.json(channel);
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

    const subscribers = channel.audience.subscribers.map((id) => id.toString());
    if (subscribers.includes(req.userId)) {
      return res.status(409).json({ err: "Already subscribed" });
    }

    channel.audience.subscribers.push(req.userId);
    channel.audience.subscriberCount = channel.audience.subscribers.length;
    await channel.save();

    res.json({ message: "Subscribed" });
  } catch (error) {
    res.status(500).json({ err: "Failed to subscribe" });
  }
};

exports.unsubscribeChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ err: "Channel not found" });

    channel.audience.subscribers = channel.audience.subscribers.filter(
      (id) => id.toString() !== req.userId,
    );
    channel.audience.subscriberCount = channel.audience.subscribers.length;
    await channel.save();

    res.json({ message: "Unsubscribed" });
  } catch (error) {
    res.status(500).json({ err: "Failed to unsubscribe" });
  }
};
