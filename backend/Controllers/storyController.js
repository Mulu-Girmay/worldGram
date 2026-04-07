const Story = require("../Models/Story");
const Contact = require("../Models/Contact");
const User = require("../Models/User");
const mongoose = require("mongoose");
const { reactToEntity } = require("../utils/reaction");
const { addViewToEntity } = require("../utils/view");

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const parseSelectedViewerInputs = (raw) => {
  const values = Array.isArray(raw)
    ? raw
    : String(raw || "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
  return [...new Set(values)];
};

const resolveSelectedViewerIds = async (authorId, selectedViewerInputs) => {
  const tokens = parseSelectedViewerInputs(selectedViewerInputs).slice(0, 200);
  if (!tokens.length) return [];

  const objectIds = tokens.filter((token) =>
    mongoose.Types.ObjectId.isValid(token),
  );
  const usernames = tokens
    .filter((token) => !mongoose.Types.ObjectId.isValid(token))
    .map((token) => token.replace(/^@/, "").trim())
    .filter(Boolean);

  let userIdsByUsername = [];
  if (usernames.length) {
    const users = await User.find({
      "identity.username": { $in: usernames },
    }).select("_id");
    userIdsByUsername = users.map((u) => String(u._id));
  }

  const candidateIds = [...new Set([...objectIds, ...userIdsByUsername])]
    .map((id) => String(id))
    .filter((id) => id && id !== String(authorId));

  if (!candidateIds.length) return [];

  const allowedContacts = await Contact.find({
    ownerUserId: authorId,
    contactUserId: { $in: candidateIds },
  }).select("contactUserId");

  const allowedSet = new Set(
    allowedContacts.map((contact) => String(contact.contactUserId || "")),
  );

  return candidateIds.filter((id) => allowedSet.has(id));
};

const buildStoryAccessContext = async (viewerId, authorIds = []) => {
  const uniqueAuthorIds = [
    ...new Set((authorIds || []).map((id) => String(id)).filter(Boolean)),
  ];
  if (!uniqueAuthorIds.length) {
    return {
      authorsWhoSavedViewer: new Set(),
      favoriteAuthorsWhoSavedViewer: new Set(),
    };
  }

  const savedViewerContacts = await Contact.find({
    ownerUserId: { $in: uniqueAuthorIds },
    contactUserId: viewerId,
  }).select("ownerUserId isFavorite");

  const authorsWhoSavedViewer = new Set();
  const favoriteAuthorsWhoSavedViewer = new Set();

  savedViewerContacts.forEach((contact) => {
    const ownerId = String(contact.ownerUserId || "");
    if (!ownerId) return;
    authorsWhoSavedViewer.add(ownerId);
    if (contact.isFavorite) favoriteAuthorsWhoSavedViewer.add(ownerId);
  });

  return {
    authorsWhoSavedViewer,
    favoriteAuthorsWhoSavedViewer,
  };
};

const sanitizeStoryForViewer = (storyDoc, viewerId) => {
  if (!storyDoc) return null;
  const story = storyDoc.toObject ? storyDoc.toObject() : { ...storyDoc };
  const authorId = getId(story.authorId);
  const requesterId = getId(viewerId);
  const isOwner = Boolean(authorId && requesterId && authorId === requesterId);

  if (isOwner) return story;

  story.viewers = (story.viewers || []).filter(
    (viewer) => getId(viewer?.userId) === requesterId,
  );
  story.reactions = (story.reactions || []).map((reaction) => ({
    ...reaction,
    reactors: (reaction?.reactors || []).filter(
      (reactor) => getId(reactor) === requesterId,
    ),
  }));
  story.selectedViewerIds = [];
  return story;
};

exports.addStory = async (req, res) => {
  try {
    const {
      caption = "",
      privacy,
      durationHours,
      selectedViewerIds,
    } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "userId not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }

    const now = new Date();
    const existingActiveStory = await Story.findOne({
      authorId: userId,
      $or: [{ expiredAt: { $gt: now } }, { expiredAt: null }],
    }).select("_id");

    if (existingActiveStory) {
      return res.status(409).json({
        message:
          "You already have an active story. Delete it or wait until it expires.",
      });
    }

    const allowedPrivacy = [
      "public",
      "contacts",
      "closeFriends",
      "selectedContacts",
    ];
    const safePrivacy = allowedPrivacy.includes(privacy) ? privacy : "contacts";
    const allowedDurationHours = [6, 12, 24, 48];
    const duration = Number(durationHours);
    const safeDurationHours = allowedDurationHours.includes(duration)
      ? duration
      : 24;
    const mediaType = req.file.mimetype?.startsWith("video/")
      ? "video"
      : "image";
    const expiresAt = new Date(
      now.getTime() + safeDurationHours * 60 * 60 * 1000,
    );
    const selectedIds =
      safePrivacy === "selectedContacts"
        ? await resolveSelectedViewerIds(userId, selectedViewerIds)
        : [];
    if (safePrivacy === "selectedContacts" && selectedIds.length === 0) {
      return res.status(400).json({
        message:
          "Selected contacts list must include at least one of your contacts.",
      });
    }

    const adding = new Story({
      authorId: userId,
      caption: caption?.trim?.() || "",
      media: req.file.filename,
      mediaType,
      privacy: safePrivacy,
      selectedViewerIds: selectedIds,
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
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ err: "Story not found" });
    const allowed = await canViewStory(story, req.userId);
    if (!allowed) return res.status(403).json({ err: "Not allowed" });

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
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ err: "Story not found" });
    const allowed = await canViewStory(story, req.userId);
    if (!allowed) return res.status(403).json({ err: "Not allowed" });

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

const STORY_AUTHOR_SELECT =
  "_id identity.firstName identity.lastName identity.username identity.profileUrl AccountStatus.isPremium";
const STORY_VIEWER_SELECT =
  "_id identity.firstName identity.lastName identity.username identity.profileUrl";

const canViewStory = async (story, userId, context = null) => {
  const authorId = getId(story.authorId);
  const viewerId = getId(userId);

  if (authorId && viewerId && authorId === viewerId) return true;
  if (story.privacy === "public") return true;
  if (story.privacy === "contacts") {
    if (context?.authorsWhoSavedViewer) {
      return context.authorsWhoSavedViewer.has(authorId);
    }
    const authorHasViewer = await Contact.findOne({
      ownerUserId: authorId,
      contactUserId: viewerId,
    });
    return Boolean(authorHasViewer);
  }
  if (story.privacy === "closeFriends") {
    if (context?.favoriteAuthorsWhoSavedViewer) {
      return context.favoriteAuthorsWhoSavedViewer.has(authorId);
    }
    const contact = await Contact.findOne({
      ownerUserId: authorId,
      contactUserId: viewerId,
      isFavorite: true,
    });
    return Boolean(contact);
  }
  if (story.privacy === "selectedContacts") {
    return (story.selectedViewerIds || [])
      .map((id) => getId(id))
      .includes(viewerId);
  }
  return false;
};

exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
      .populate("authorId", STORY_AUTHOR_SELECT)
      .populate("viewers.userId", STORY_VIEWER_SELECT)
      .populate("reactions.reactors", STORY_VIEWER_SELECT);
    if (!story) return res.status(404).json({ err: "Story not found" });

    const allowed = await canViewStory(story, req.userId);
    if (!allowed) return res.status(403).json({ err: "Not allowed" });

    res.json(sanitizeStoryForViewer(story, req.userId));
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

    const stories = await Story.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("authorId", STORY_AUTHOR_SELECT)
      .populate("viewers.userId", "_id");
    const storyAuthorIds = stories.map((story) => getId(story.authorId));
    const accessContext = await buildStoryAccessContext(
      req.userId,
      storyAuthorIds,
    );
    const visible = [];
    const favoriteContactIds = new Set(
      (
        await Contact.find({
          ownerUserId: req.userId,
          isFavorite: true,
        }).select("contactUserId")
      ).map((contact) => getId(contact.contactUserId)),
    );
    const regularContactIds = new Set(
      (
        await Contact.find({
          ownerUserId: req.userId,
        }).select("contactUserId")
      ).map((contact) => getId(contact.contactUserId)),
    );

    for (const story of stories) {
      if (await canViewStory(story, req.userId, accessContext)) {
        visible.push(sanitizeStoryForViewer(story, req.userId));
      }
    }

    const prioritized = visible.sort((a, b) => {
      const aid = getId(a.authorId);
      const bid = getId(b.authorId);
      const aPremiumContact =
        favoriteContactIds.has(aid) &&
        Boolean(a?.authorId?.AccountStatus?.isPremium);
      const bPremiumContact =
        favoriteContactIds.has(bid) &&
        Boolean(b?.authorId?.AccountStatus?.isPremium);
      if (aPremiumContact !== bPremiumContact) return aPremiumContact ? -1 : 1;
      const aRegular = regularContactIds.has(aid);
      const bRegular = regularContactIds.has(bid);
      if (aRegular !== bRegular) return aRegular ? -1 : 1;
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });

    const nextCursor =
      stories.length === limit ? stories[stories.length - 1]._id : null;

    res.json({ items: prioritized, nextCursor });
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

    const stories = await Story.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("authorId", STORY_AUTHOR_SELECT);
    const accessContext = await buildStoryAccessContext(req.userId, [userId]);
    const visible = [];
    for (const story of stories) {
      if (await canViewStory(story, req.userId, accessContext)) {
        visible.push(sanitizeStoryForViewer(story, req.userId));
      }
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

exports.updateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ err: "Story not found" });
    if (getId(story.authorId) !== getId(req.userId)) {
      return res.status(403).json({ err: "Not allowed" });
    }

    const { caption, privacy, durationHours, selectedViewerIds, isHighlight } =
      req.body;

    if (typeof caption === "string") {
      story.caption = caption.trim();
    }
    const allowedPrivacy = [
      "public",
      "contacts",
      "closeFriends",
      "selectedContacts",
    ];
    if (allowedPrivacy.includes(privacy)) {
      story.privacy = privacy;
      if (privacy !== "selectedContacts") {
        story.selectedViewerIds = [];
      }
    }
    if (typeof isHighlight === "boolean") {
      story.isHighlight = isHighlight;
    }
    if (
      story.privacy === "selectedContacts" &&
      selectedViewerIds !== undefined
    ) {
      const selectedIds = await resolveSelectedViewerIds(
        req.userId,
        selectedViewerIds,
      );
      if (selectedIds.length === 0) {
        return res.status(400).json({
          err: "Selected contacts list must include at least one of your contacts.",
        });
      }
      story.selectedViewerIds = selectedIds;
    }
    const allowedDurationHours = [6, 12, 24, 48];
    const duration = Number(durationHours);
    if (allowedDurationHours.includes(duration)) {
      story.expiredAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    await story.save();
    const hydrated = await Story.findById(story._id)
      .populate("authorId", STORY_AUTHOR_SELECT)
      .populate("viewers.userId", STORY_VIEWER_SELECT)
      .populate("reactions.reactors", STORY_VIEWER_SELECT);

    res.json({ message: "Story updated", story: hydrated });
  } catch (err) {
    res.status(500).json({ err: "Failed to update story" });
  }
};

exports.listHighlights = async (req, res) => {
  try {
    const { userId } = req.params;
    const highlights = await Story.find({
      authorId: userId,
      isHighlight: true,
    })
      .sort({ _id: -1 })
      .populate("authorId", STORY_AUTHOR_SELECT)
      .populate("viewers.userId", "_id");
    const accessContext = await buildStoryAccessContext(req.userId, [userId]);
    const visible = [];
    for (const story of highlights) {
      if (await canViewStory(story, req.userId, accessContext)) {
        visible.push(sanitizeStoryForViewer(story, req.userId));
      }
    }
    res.json({ items: visible });
  } catch (err) {
    res.status(500).json({ err: "Failed to list highlights" });
  }
};
