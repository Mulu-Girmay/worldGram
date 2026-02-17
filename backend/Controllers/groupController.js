const Group = require("../Models/Group");
const User = require("../Models/User");
const Chat = require("../Models/Chat");
const mongoose = require("mongoose");
exports.createGroup = async (req, res) => {
  let { name, userName, description, groupPhoto } = req.body;
  try {
    const newGroup = new Group({
      basicInfo: {
        groupName: name,
        groupUsername: userName,
        description: description,
        groupPhoto: groupPhoto,
      },
      members: {
        members: [req.userId],
        ownerId: req.userId,
        admins: [req.userId],
      },
    });
    await newGroup.save();
    res.json({
      message: "Group created successfully",
      groupId: newGroup._id,
    });
  } catch (error) {
    console.error("Group creation error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Username already exists" });
    }
    return res.status(500).json({ error: "Failed to create group" });
  }
};
exports.updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.userId;
    const { updatedData } = req.body; // dynamic updates

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ err: "Group not found" });
    }

    const admins = group.members.admins.map((id) => id.toString());

    if (!admins.includes(userId)) {
      return res
        .status(401)
        .json({ err: "You are not authorized to update this Group" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: updatedData },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      message: "Group successfully updated",
      updatedGroup,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Group failed to update" });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.userId;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ err: "Group not found" });
    }
    const admins = group.members.admins.map((id) => id.toString());

    if (!admins.includes(userId)) {
      return res
        .status(401)
        .json({ err: "You are not authorized to delete this Group" });
    }
    const deletedGroup = await Group.findByIdAndDelete(groupId);
    res.status(200).json({
      message: "Group successfully deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Group failed to delete" });
  }
};

exports.addMember = async (req, res) => {
  try {
    let { newMemberUsername } = req.body;
    const userId = req.userId;

    let groupId = req.params.id;
    const group = await Group.findById(groupId);
    if (!newMemberUsername) {
      return res.status(400).json({
        err: "newAdminUsername is required",
      });
    }
    if (!group) {
      return res.status(404).json({ err: "group not found" });
    }
    const members = group.members.members.map((id) => id.toString());

    if (!members.includes(userId)) {
      return res
        .status(403)
        .json({ err: "You have to be a member to add members in this group" });
    }
    const memberExists = await User.findOne({
      "identity.username": newMemberUsername,
    });
    if (!memberExists) {
      return res.status(404).json({ err: "member username not found" });
    }
    const newMemberId = memberExists._id.toString();

    if (members.includes(newMemberId)) {
      return res.status(409).json({
        err: "User is already a member",
      });
    }
    group.members.members.push(newMemberId);
    await group.save();
    await Chat.findOneAndUpdate(
      { groupId },
      { $addToSet: { participants: newMemberId } },
    );

    res.status(200).json({
      message: "member successfully added",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: " failed to add member" });
  }
};
exports.addAdmin = async (req, res) => {
  try {
    let { newAdminUsername } = req.body;
    const userId = req.userId;

    let groupId = req.params.id;
    const group = await Group.findById(groupId);
    if (!newAdminUsername) {
      return res.status(400).json({
        err: "newAdminUsername is required",
      });
    }
    if (!group) {
      return res.status(404).json({ err: "group not found" });
    }
    const admins = group.members.admins.map((id) => id.toString());

    if (!admins.includes(userId)) {
      return res
        .status(403)
        .json({ err: "You are not authorized to add admins in this group" });
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
    group.members.admins.push(newAdminId);
    await group.save();

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
    const groupId = req.params.id;

    // Validate input
    if (!adminUsername) {
      return res.status(400).json({ err: "adminUsername is required" });
    }

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ err: "group not found" });
    }

    // Only existing admins can remove other admins
    const admins = group.members.admins.map((id) => id.toString());
    if (!admins.includes(userId)) {
      return res.status(403).json({
        err: "You are not authorized to remove admins from this group",
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
    group.members.admins = group.members.admins.filter(
      (id) => id.toString() !== adminToRemoveId,
    );

    await group.save();

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

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });

    const isMember = group.members.members
      .map((id) => id.toString())
      .includes(req.userId);

    if (!group.settings.isPublic && !isMember) {
      return res.status(403).json({ err: "Not allowed to view this group" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch group" });
  }
};

exports.listGroups = async (req, res) => {
  try {
    const { cursor, q } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = {};
    if (q) {
      query["basicInfo.groupName"] = { $regex: q, $options: "i" };
    }
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const groups = await Group.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor =
      groups.length === limit ? groups[groups.length - 1]._id : null;

    res.json({ items: groups, nextCursor });
  } catch (error) {
    res.status(500).json({ err: "Failed to list groups" });
  }
};

exports.listMyGroups = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = { "members.members": req.userId };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const groups = await Group.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor =
      groups.length === limit ? groups[groups.length - 1]._id : null;

    res.json({ items: groups, nextCursor });
  } catch (error) {
    res.status(500).json({ err: "Failed to list groups" });
  }
};

exports.listGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      "members.members",
    );
    if (!group) return res.status(404).json({ err: "Group not found" });

    const isMember = group.members.members
      .map((u) => u._id.toString())
      .includes(req.userId);

    if (!group.settings.isPublic && !isMember) {
      return res.status(403).json({ err: "Not allowed to view members" });
    }

    res.json({ members: group.members.members });
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch members" });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });

    if (!group.settings.isPublic) {
      return res.status(403).json({ err: "Group is private" });
    }

    const members = group.members.members.map((id) => id.toString());
    if (members.includes(req.userId)) {
      return res.status(409).json({ err: "Already a member" });
    }

    group.members.members.push(req.userId);
    await group.save();
    await Chat.findOneAndUpdate(
      { groupId: req.params.id },
      { $addToSet: { participants: req.userId } },
    );
    res.json({ message: "Joined group" });
  } catch (error) {
    res.status(500).json({ err: "Failed to join group" });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });

    group.members.members = group.members.members.filter(
      (id) => id.toString() !== req.userId,
    );
    group.members.admins = group.members.admins.filter(
      (id) => id.toString() !== req.userId,
    );
    if (group.members.ownerId?.toString() === req.userId) {
      return res.status(403).json({ err: "Owner cannot leave group" });
    }
    await group.save();
    await Chat.findOneAndUpdate(
      { groupId: req.params.id },
      { $pull: { participants: req.userId } },
    );
    res.json({ message: "Left group" });
  } catch (error) {
    res.status(500).json({ err: "Failed to leave group" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });

    const admins = group.members.admins.map((id) => id.toString());
    if (!admins.includes(req.userId)) {
      return res
        .status(403)
        .json({ err: "You are not authorized to remove members" });
    }

    group.members.members = group.members.members.filter(
      (id) => id.toString() !== memberId,
    );
    group.members.admins = group.members.admins.filter(
      (id) => id.toString() !== memberId,
    );
    await group.save();
    await Chat.findOneAndUpdate(
      { groupId: req.params.id },
      { $pull: { participants: memberId } },
    );

    res.json({ message: "Member removed" });
  } catch (error) {
    res.status(500).json({ err: "Failed to remove member" });
  }
};

exports.updateGroupPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ err: "Group not found" });

    const admins = group.members.admins.map((id) => id.toString());
    if (!admins.includes(req.userId)) {
      return res
        .status(403)
        .json({ err: "You are not authorized to update permissions" });
    }

    group.permissions = { ...group.permissions, ...permissions };
    await group.save();

    res.json({ message: "Permissions updated", permissions: group.permissions });
  } catch (error) {
    res.status(500).json({ err: "Failed to update permissions" });
  }
};
