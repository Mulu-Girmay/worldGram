const express = require("express");
const {
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  addAdmin,
  removeAdmin,
  getGroupById,
  listGroups,
  listMyGroups,
  listGroupMembers,
  joinGroup,
  leaveGroup,
  removeMember,
  updateGroupPermissions,
} = require("../Controllers/groupController");
const groupRouter = express.Router();
const auth = require("../Middleware/authMiddleware");

groupRouter.get("/groups", auth, listGroups);
groupRouter.get("/groups/me", auth, listMyGroups);
groupRouter.get("/groups/:id", auth, getGroupById);
groupRouter.get("/groups/:id/members", auth, listGroupMembers);
groupRouter.post("/groups/:id/join", auth, joinGroup);
groupRouter.post("/groups/:id/leave", auth, leaveGroup);
groupRouter.post("/groups/:id/removeMember", auth, removeMember);
groupRouter.patch("/groups/:id/permissions", auth, updateGroupPermissions);

groupRouter.post(
  "/addGroup",
  auth,
  createGroup,
);
groupRouter.patch(
  "/updateGroup/:id",
  auth,
  updateGroup,
);
groupRouter.delete(
  "/deleteGroup/:id",
  auth,
  deleteGroup,
);
groupRouter.post(
  "/addMember/:id",
  auth,
  addMember,
);
groupRouter.post(
  "/addGroupAdmin/:id",
  auth,
  addAdmin,
);
groupRouter.post(
  "/removeAdmin/:id",
  auth,
  removeAdmin,
);
module.exports = groupRouter;
