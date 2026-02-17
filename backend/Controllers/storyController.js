const Story = require("../Models/Story");
const Contact = require("../Models/Contact");
const mongoose = require("mongoose");
const { reactToEntity } = require("../utils/reaction");
const { addViewToEntity } = require("../utils/view");

exports.addStory = async (req, res) => {
  try {
    const { caption = "", privacy } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "userId not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }

    const allowedPrivacy = ["public", "contacts", "closeFriends"];
    const safePrivacy = allowedPrivacy.includes(privacy) ? privacy : "contacts";
    const mediaType = req.file.mimetype?.startsWith("video/")
      ? "video"
      : "image";
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const adding = new Story({
      authorId: userId,
      caption: caption?.trim?.() || "",
      media: req.file.filename,
      mediaType,
      privacy: safePrivacy,
      expiredAt: expiresAt,
    });
    const saved = await adding.save();
    res.status(201).json({
      message: "successfully added story",
      story: saved,
    });
  } catch (err) {
    res.status(500).json({ message: "failed to post story", err: err.message });
  }
};

exports.reactToStory = async (req, res) => {
  try {
    const result = await reactToEntity({
      Model: Story,
      findQuery: { _id: req.params.storyId },
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

exports.addViewToStory = async (req, res) => {
  try {
    const result = await addViewToEntity({
      Model: Story,
      findQuery: { _id: req.params.storyId },
      userId: req.userId,
      viewersPath: "viewers",
      viewerIdField: "userId",
      viewedAtField: "viewedAt",
      notFoundMessage: "Story not found",
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

const canViewStory = async (story, userId) => {
  if (story.authorId?.toString() === userId) return true;
  if (story.privacy === "public") return true;
  if (story.privacy === "contacts") {
    const contact = await Contact.findOne({
      ownerUserId: story.authorId,
      contactUserId: userId,
    });
    return Boolean(contact);
  }
  if (story.privacy === "closeFriends") {
    const contact = await Contact.findOne({
      ownerUserId: story.authorId,
      contactUserId: userId,
      isFavorite: true,
    });
    return Boolean(contact);
  }
  return false;
};

exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ err: "Story not found" });

    const allowed = await canViewStory(story, req.userId);
    if (!allowed) return res.status(403).json({ err: "Not allowed" });

    res.json(story);
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch story" });
  }
};

exports.listStories = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = {};
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }
    if (!query.expiredAt) {
      query.$or = [{ expiredAt: { $gt: new Date() } }, { expiredAt: null }];
    }

    const stories = await Story.find(query).sort({ _id: -1 }).limit(limit);
    const visible = [];
    for (const story of stories) {
      if (await canViewStory(story, req.userId)) visible.push(story);
    }

    const nextCursor =
      stories.length === limit ? stories[stories.length - 1]._id : null;

    res.json({ items: visible, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to list stories" });
  }
};

exports.listUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = { authorId: userId };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }
    query.$or = [{ expiredAt: { $gt: new Date() } }, { expiredAt: null }];

    const stories = await Story.find(query).sort({ _id: -1 }).limit(limit);
    const visible = [];
    for (const story of stories) {
      if (await canViewStory(story, req.userId)) visible.push(story);
    }

    const nextCursor =
      stories.length === limit ? stories[stories.length - 1]._id : null;

    res.json({ items: visible, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to list user stories" });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ err: "Story not found" });
    if (story.authorId?.toString() !== req.userId) {
      return res.status(403).json({ err: "Not allowed" });
    }

    await Story.findByIdAndDelete(req.params.storyId);
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ err: "Failed to delete story" });
  }
};
