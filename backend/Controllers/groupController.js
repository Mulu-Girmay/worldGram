const Group = require("../Models/Group");
const User = require("../Models/User");
const Chat = require("../Models/Chat");
const GroupAction = require("../Models/GroupAction");
const mongoose = require("mongoose");

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const ids = (arr = []) => arr.map((id) => id?.toString?.() || String(id));
const isOwner = (g, u) => g?.members?.ownerId?.toString?.() === String(u);
const isAdmin = (g, u) => ids(g?.members?.admins || []).includes(String(u));
const isMember = (g, u) => ids(g?.members?.members || []).includes(String(u));
const isOwnerOrAdmin = (g, u) => isOwner(g, u) || isAdmin(g, u);

const logAction = async (groupId, actorId, action, targetType, targetId, meta) => {
  try {
    await GroupAction.create({
      groupId,
      actorId,
      action,
      targetType: targetType || null,
      targetId: targetId || null,
      meta: meta || null,
    });
  } catch (error) {
    console.error("group action log error:", error?.message || error);
  }
};

const defaultPermissions = {
  canSendMessages: true,
  canSendMedia: true,
  canSendPhotos: true,
  canSendVideos: true,
  canSendStickers: true,
  canSendGifs: true,
  canSendVoiceVideo: true,
  canAddMembers: true,
  canPinMessages: true,
  canEmbedLinks: true,
  canCreatePolls: true,
  canChangeChatInfo: false,
};

const effectivePermissions = (group, userId) => {
  const base = { ...defaultPermissions, ...(group?.permissions || {}) };
  const exception = (group?.permissions?.exceptions || []).find(
    (ex) => ex?.userId?.toString?.() === String(userId),
  );
  return exception ? { ...base, ...(exception?.overrides || {}) } : base;
};

exports.createGroup = async (req, res) => {
  const { name, userName, description, groupPhoto } = req.body;
  try {
    const group = await Group.create({
      basicInfo: {
        groupName: name,
        groupUsername: userName,
        description,
        groupPhoto,
      },
      members: {
        members: [req.userId],
        ownerId: req.userId,
        admins: [req.userId],
        adminProfiles: [{ userId: req.userId, customTitle: "Owner" }],
      },
      permissions: defaultPermissions,
      settings: {
        isPublic: true,
        slowModeSeconds: 0,
        maxMembers: 200000,
        broadcastOnlyAdmins: false,
        topicsEnabled: false,
        defaultViewMode: "message",
      },
      topics: [],
    });
    await logAction(group._id, req.userId, "group_created");
    return res.json({ message: "Group created successfully", groupId: group._id });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: "Username already exists" });
    return res.status(500).json({ error: "Failed to create group" });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    const perms = effectivePermissions(group, req.userId);
    if (!isOwnerOrAdmin(group, req.userId) && !perms.canChangeChatInfo) {
      return res.status(401).json({ err: "You are not authorized to update this Group" });
    }
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: req.body?.updatedData || {} },
      { new: true, runValidators: true },
    );
    await logAction(group._id, req.userId, "group_updated", null, null, {
      fields: Object.keys(req.body?.updatedData || {}),
    });
    return res.status(200).json({ message: "Group successfully updated", updatedGroup });
  } catch {
    return res.status(500).json({ err: "Group failed to update" });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwner(group, req.userId)) {
      return res.status(401).json({ err: "Only owner can delete this Group" });
    }
    await Group.findByIdAndDelete(req.params.id);
    await logAction(req.params.id, req.userId, "group_deleted");
    return res.status(200).json({ message: "Group successfully deleted" });
  } catch {
    return res.status(500).json({ err: "Group failed to delete" });
  }
};

exports.addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    const { newMemberUsername } = req.body;
    if (!newMemberUsername) return res.status(400).json({ err: "newMemberUsername is required" });
    if (!group) return res.status(404).json({ err: "group not found" });
    if (!isMember(group, req.userId)) {
      return res.status(403).json({ err: "You have to be a member to add members in this group" });
    }
    const perms = effectivePermissions(group, req.userId);
    if (!isOwnerOrAdmin(group, req.userId) && !perms.canAddMembers) {
      return res.status(403).json({ err: "You are not allowed to add members in this group" });
    }
    const user = await User.findOne({ "identity.username": newMemberUsername });
    if (!user) return res.status(404).json({ err: "member username not found" });
    const newMemberId = user._id.toString();
    if (isMember(group, newMemberId)) return res.status(409).json({ err: "User is already a member" });
    const maxMembers = Number(group?.settings?.maxMembers || 200000);
    if (!group?.settings?.broadcastOnlyAdmins && (group.members.members || []).length >= maxMembers) {
      return res.status(403).json({ err: "Group member limit reached. Convert to broadcast group." });
    }
    group.members.members.push(newMemberId);
    await group.save();
    await Chat.findOneAndUpdate({ groupId: req.params.id }, { $addToSet: { participants: newMemberId } });
    await logAction(group._id, req.userId, "member_added", "user", newMemberId, { username: newMemberUsername });
    return res.status(200).json({ message: "member successfully added" });
  } catch {
    return res.status(500).json({ err: " failed to add member" });
  }
};

exports.addAdmin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    const { newAdminUsername } = req.body;
    if (!newAdminUsername) return res.status(400).json({ err: "newAdminUsername is required" });
    if (!group) return res.status(404).json({ err: "group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) {
      return res.status(403).json({ err: "You are not authorized to add admins in this group" });
    }
    const user = await User.findOne({ "identity.username": newAdminUsername });
    if (!user) return res.status(404).json({ err: "admin username not found" });
    const newAdminId = user._id.toString();
    if (isAdmin(group, newAdminId)) return res.status(409).json({ err: "User is already an admin" });
    if (!isMember(group, newAdminId)) group.members.members.push(newAdminId);
    group.members.admins.push(newAdminId);
    group.members.adminProfiles = group.members.adminProfiles || [];
    group.members.adminProfiles.push({ userId: newAdminId, customTitle: "Admin", isAnonymous: false });
    await group.save();
    await logAction(group._id, req.userId, "admin_added", "user", newAdminId, { username: newAdminUsername });
    return res.status(200).json({ message: "admin successfully added" });
  } catch {
    return res.status(500).json({ err: " failed to add admin" });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { adminUsername } = req.body;
    const group = await Group.findById(req.params.id);
    if (!adminUsername) return res.status(400).json({ err: "adminUsername is required" });
    if (!group) return res.status(404).json({ err: "group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) {
      return res.status(403).json({ err: "You are not authorized to remove admins from this group" });
    }
    const user = await User.findOne({ "identity.username": adminUsername });
    if (!user) return res.status(404).json({ err: "Admin username not found" });
    const removeId = user._id.toString();
    if (!isAdmin(group, removeId)) return res.status(409).json({ err: "This user is not an admin" });
    if (isOwner(group, removeId)) return res.status(403).json({ err: "Cannot remove owner" });
    group.members.admins = (group.members.admins || []).filter((id) => id.toString() !== removeId);
    group.members.adminProfiles = (group.members.adminProfiles || []).filter((p) => p?.userId?.toString?.() !== removeId);
    await group.save();
    await logAction(group._id, req.userId, "admin_removed", "user", removeId);
    return res.status(200).json({ message: "Admin successfully removed" });
  } catch {
    return res.status(500).json({ err: "Failed to remove admin" });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized" });
    const { adminUsername, isAnonymous, customTitle, permissions } = req.body || {};
    if (!adminUsername) return res.status(400).json({ err: "adminUsername is required" });
    const user = await User.findOne({ "identity.username": adminUsername });
    if (!user) return res.status(404).json({ err: "admin user not found" });
    const adminId = user._id.toString();
    if (!isAdmin(group, adminId)) return res.status(400).json({ err: "User is not admin" });
    group.members.adminProfiles = group.members.adminProfiles || [];
    const idx = group.members.adminProfiles.findIndex((p) => p?.userId?.toString?.() === adminId);
    const next = {
      userId: adminId,
      isAnonymous: typeof isAnonymous === "boolean" ? isAnonymous : false,
      customTitle: customTitle || "Admin",
      permissions: { ...(idx >= 0 ? group.members.adminProfiles[idx].permissions || {} : {}), ...(permissions || {}) },
    };
    if (idx >= 0) group.members.adminProfiles[idx] = next;
    else group.members.adminProfiles.push(next);
    await group.save();
    await logAction(group._id, req.userId, "admin_profile_updated", "user", adminId);
    return res.json({ message: "Admin profile updated" });
  } catch {
    return res.status(500).json({ err: "Failed to update admin profile" });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!group.settings.isPublic && !isMember(group, req.userId)) return res.status(403).json({ err: "Not allowed to view this group" });
    return res.json(group);
  } catch {
    return res.status(500).json({ err: "Failed to fetch group" });
  }
};

exports.listGroups = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const query = {};
    if (req.query.q) query["basicInfo.groupName"] = { $regex: req.query.q, $options: "i" };
    if (req.query.cursor && mongoose.Types.ObjectId.isValid(req.query.cursor)) query._id = { $lt: req.query.cursor };
    const items = await Group.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor = items.length === limit ? items[items.length - 1]._id : null;
    return res.json({ items, nextCursor });
  } catch {
    return res.status(500).json({ err: "Failed to list groups" });
  }
};

exports.listMyGroups = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const query = { "members.members": req.userId };
    if (req.query.cursor && mongoose.Types.ObjectId.isValid(req.query.cursor)) query._id = { $lt: req.query.cursor };
    const items = await Group.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor = items.length === limit ? items[items.length - 1]._id : null;
    return res.json({ items, nextCursor });
  } catch {
    return res.status(500).json({ err: "Failed to list groups" });
  }
};

exports.listGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members.members");
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!group.settings.isPublic && !isMember(group, req.userId)) return res.status(403).json({ err: "Not allowed to view members" });
    return res.json({ members: group.members.members });
  } catch {
    return res.status(500).json({ err: "Failed to fetch members" });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!group.settings.isPublic) return res.status(403).json({ err: "Group is private" });
    if (isMember(group, req.userId)) return res.status(409).json({ err: "Already a member" });
    const maxMembers = Number(group?.settings?.maxMembers || 200000);
    if (!group?.settings?.broadcastOnlyAdmins && (group.members.members || []).length >= maxMembers) {
      return res.status(403).json({ err: "Group member limit reached. Convert to broadcast group." });
    }
    group.members.members.push(req.userId);
    await group.save();
    await Chat.findOneAndUpdate({ groupId: req.params.id }, { $addToSet: { participants: req.userId } });
    await logAction(group._id, req.userId, "member_joined", "user", req.userId);
    return res.json({ message: "Joined group" });
  } catch {
    return res.status(500).json({ err: "Failed to join group" });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (isOwner(group, req.userId)) return res.status(403).json({ err: "Owner cannot leave group" });
    group.members.members = (group.members.members || []).filter((id) => id.toString() !== req.userId);
    group.members.admins = (group.members.admins || []).filter((id) => id.toString() !== req.userId);
    group.members.adminProfiles = (group.members.adminProfiles || []).filter((p) => p?.userId?.toString?.() !== req.userId);
    await group.save();
    await Chat.findOneAndUpdate({ groupId: req.params.id }, { $pull: { participants: req.userId } });
    await logAction(group._id, req.userId, "member_left", "user", req.userId);
    return res.json({ message: "Left group" });
  } catch {
    return res.status(500).json({ err: "Failed to leave group" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "You are not authorized to remove members" });
    group.members.members = (group.members.members || []).filter((id) => id.toString() !== memberId);
    group.members.admins = (group.members.admins || []).filter((id) => id.toString() !== memberId);
    group.members.adminProfiles = (group.members.adminProfiles || []).filter((p) => p?.userId?.toString?.() !== memberId);
    await group.save();
    await Chat.findOneAndUpdate({ groupId: req.params.id }, { $pull: { participants: memberId } });
    await logAction(group._id, req.userId, "member_removed", "user", memberId);
    return res.json({ message: "Member removed" });
  } catch {
    return res.status(500).json({ err: "Failed to remove member" });
  }
};

exports.updateGroupPermissions = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "You are not authorized to update permissions" });
    group.permissions = { ...(group.permissions || {}), ...(req.body?.permissions || {}) };
    await group.save();
    await logAction(group._id, req.userId, "permissions_updated");
    return res.json({ message: "Permissions updated", permissions: group.permissions });
  } catch {
    return res.status(500).json({ err: "Failed to update permissions" });
  }
};

exports.updateMemberException = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized" });
    const { memberId, overrides } = req.body || {};
    if (!memberId || typeof overrides !== "object") return res.status(400).json({ err: "memberId and overrides are required" });
    group.permissions.exceptions = group.permissions.exceptions || [];
    const idx = group.permissions.exceptions.findIndex((ex) => ex?.userId?.toString?.() === String(memberId));
    if (idx >= 0) group.permissions.exceptions[idx].overrides = { ...(group.permissions.exceptions[idx].overrides || {}), ...overrides };
    else group.permissions.exceptions.push({ userId: memberId, overrides });
    await group.save();
    await logAction(group._id, req.userId, "member_exception_updated", "user", memberId);
    return res.json({ message: "Member exception updated" });
  } catch {
    return res.status(500).json({ err: "Failed to update member exception" });
  }
};

exports.listTopics = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isMember(group, req.userId) && !group.settings.isPublic) return res.status(403).json({ err: "Not allowed to view topics" });
    return res.json({
      topicsEnabled: Boolean(group?.settings?.topicsEnabled),
      defaultViewMode: group?.settings?.defaultViewMode || "message",
      items: group.topics || [],
    });
  } catch {
    return res.status(500).json({ err: "Failed to list topics" });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized to create topics" });
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ err: "Topic name is required" });
    group.settings.topicsEnabled = true;
    group.topics = group.topics || [];
    group.topics.push({ name, description: String(req.body?.description || "").trim(), createdBy: req.userId });
    await group.save();
    return res.status(201).json({ message: "Topic created", topic: group.topics[group.topics.length - 1] });
  } catch {
    return res.status(500).json({ err: "Failed to create topic" });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized to update topics" });
    const topic = (group.topics || []).id(req.params.topicId);
    if (!topic) return res.status(404).json({ err: "Topic not found" });
    if (typeof req.body?.name === "string") topic.name = req.body.name.trim();
    if (typeof req.body?.description === "string") topic.description = req.body.description.trim();
    if (typeof req.body?.isClosed === "boolean") topic.isClosed = req.body.isClosed;
    await group.save();
    return res.json({ message: "Topic updated", topic });
  } catch {
    return res.status(500).json({ err: "Failed to update topic" });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized to delete topics" });
    const topic = (group.topics || []).id(req.params.topicId);
    if (!topic) return res.status(404).json({ err: "Topic not found" });
    topic.deleteOne();
    await group.save();
    return res.json({ message: "Topic deleted" });
  } catch {
    return res.status(500).json({ err: "Failed to delete topic" });
  }
};

exports.setGroupViewMode = async (req, res) => {
  try {
    const viewMode = req.body?.viewMode;
    if (!["topic", "message"].includes(viewMode)) return res.status(400).json({ err: "viewMode must be topic or message" });
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isMember(group, req.userId)) return res.status(403).json({ err: "Not allowed to change view mode" });
    group.settings.defaultViewMode = viewMode;
    await group.save();
    return res.json({ message: "View mode updated", viewMode });
  } catch {
    return res.status(500).json({ err: "Failed to set view mode" });
  }
};

exports.convertToBroadcast = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not allowed to convert group type" });
    group.settings.broadcastOnlyAdmins = true;
    group.permissions.canSendMessages = false;
    await group.save();
    return res.json({ message: "Group converted to broadcast mode" });
  } catch {
    return res.status(500).json({ err: "Failed to convert group" });
  }
};

exports.updateSlowMode = async (req, res) => {
  try {
    const sec = Number(req.body?.slowModeSeconds);
    if (![0, 10, 30, 60, 300, 900, 3600].includes(sec)) {
      return res.status(400).json({ err: "slowModeSeconds must be 0,10,30,60,300,900,3600" });
    }
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized to update slow mode" });
    group.settings.slowModeSeconds = sec;
    await group.save();
    return res.json({ message: "Slow mode updated", slowModeSeconds: sec });
  } catch {
    return res.status(500).json({ err: "Failed to update slow mode" });
  }
};

exports.updateAutoOwnershipTransfer = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwner(group, req.userId)) {
      return res.status(403).json({ err: "Only owner can update auto-transfer settings" });
    }
    const enabled = typeof req.body?.enabled === "boolean" ? req.body.enabled : false;
    const inactivityDays = Number(req.body?.inactivityDays || 7);
    let designatedAdminId = group?.settings?.autoOwnershipTransfer?.designatedAdminId || null;
    if (req.body?.designatedAdminUsername) {
      const user = await User.findOne({
        "identity.username": String(req.body.designatedAdminUsername).trim(),
      });
      if (!user) return res.status(404).json({ err: "designated admin not found" });
      if (!isAdmin(group, user._id)) {
        return res.status(400).json({ err: "designated admin must already be an admin" });
      }
      designatedAdminId = user._id;
    }
    group.settings.autoOwnershipTransfer = {
      enabled,
      inactivityDays,
      designatedAdminId,
    };
    await group.save();
    return res.json({ message: "Auto ownership transfer updated", autoOwnershipTransfer: group.settings.autoOwnershipTransfer });
  } catch {
    return res.status(500).json({ err: "Failed to update auto ownership transfer" });
  }
};

exports.getGroupRecentActions = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not allowed to view recent actions" });
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const limit = parseLimit(req.query.limit, 50, 100);
    const items = await GroupAction.find({ groupId: req.params.id, createdAt: { $gte: since } })
      .sort({ _id: -1 })
      .limit(limit)
      .populate("actorId", "_id identity.firstName identity.lastName identity.username");
    return res.json({ items });
  } catch {
    return res.status(500).json({ err: "Failed to fetch recent actions" });
  }
};

exports.boostGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isMember(group, req.userId)) return res.status(403).json({ err: "Only members can boost this group" });
    group.settings.boosts = group.settings.boosts || { points: 0, level: 0 };
    group.settings.boosts.points += 1;
    group.settings.boosts.level = Math.floor(group.settings.boosts.points / 5);
    await group.save();
    return res.json({ message: "Group boosted", boosts: group.settings.boosts });
  } catch {
    return res.status(500).json({ err: "Failed to boost group" });
  }
};

exports.startLiveStream = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Only admins can start live stream" });
    group.settings.liveStream = { isLive: true, startedBy: req.userId, startedAt: new Date(), raisedHands: [] };
    await group.save();
    return res.json({ message: "Live stream started", liveStream: group.settings.liveStream });
  } catch {
    return res.status(500).json({ err: "Failed to start live stream" });
  }
};

exports.endLiveStream = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Only admins can end live stream" });
    group.settings.liveStream = { ...(group.settings.liveStream || {}), isLive: false, raisedHands: [] };
    await group.save();
    return res.json({ message: "Live stream ended", liveStream: group.settings.liveStream });
  } catch {
    return res.status(500).json({ err: "Failed to end live stream" });
  }
};

exports.raiseHand = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isMember(group, req.userId)) return res.status(403).json({ err: "Only members can raise hand" });
    if (!group?.settings?.liveStream?.isLive) return res.status(400).json({ err: "Live stream is not active" });
    group.settings.liveStream.raisedHands = group.settings.liveStream.raisedHands || [];
    if (!ids(group.settings.liveStream.raisedHands).includes(req.userId)) group.settings.liveStream.raisedHands.push(req.userId);
    await group.save();
    return res.json({ message: "Hand raised" });
  } catch {
    return res.status(500).json({ err: "Failed to raise hand" });
  }
};

exports.addMiniApp = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized to add mini app" });
    const name = String(req.body?.name || "").trim();
    const url = String(req.body?.url || "").trim();
    if (!name || !url) return res.status(400).json({ err: "name and url are required" });
    group.settings.miniApps = group.settings.miniApps || [];
    group.settings.miniApps.push({ name, url, enabled: true });
    await group.save();
    return res.status(201).json({ message: "Mini app added" });
  } catch {
    return res.status(500).json({ err: "Failed to add mini app" });
  }
};

exports.removeMiniApp = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });
    if (!isOwnerOrAdmin(group, req.userId)) return res.status(403).json({ err: "Not authorized to remove mini app" });
    group.settings.miniApps = (group.settings.miniApps || []).filter(
      (app) => app?._id?.toString?.() !== String(req.params.appId),
    );
    await group.save();
    return res.json({ message: "Mini app removed" });
  } catch {
    return res.status(500).json({ err: "Failed to remove mini app" });
  }
};
