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
  updateMemberException,
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  setGroupViewMode,
  convertToBroadcast,
  updateSlowMode,
  updateAdminProfile,
  getGroupRecentActions,
  updateAutoOwnershipTransfer,
  boostGroup,
  startLiveStream,
  endLiveStream,
  raiseHand,
  addMiniApp,
  removeMiniApp,
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
groupRouter.patch("/groups/:id/member-exception", auth, updateMemberException);
groupRouter.get("/groups/:id/topics", auth, listTopics);
groupRouter.post("/groups/:id/topics", auth, createTopic);
groupRouter.patch("/groups/:id/topics/:topicId", auth, updateTopic);
groupRouter.delete("/groups/:id/topics/:topicId", auth, deleteTopic);
groupRouter.patch("/groups/:id/view-mode", auth, setGroupViewMode);
groupRouter.post("/groups/:id/convert-broadcast", auth, convertToBroadcast);
groupRouter.patch("/groups/:id/slow-mode", auth, updateSlowMode);
groupRouter.patch("/groups/:id/admin-profile", auth, updateAdminProfile);
groupRouter.patch("/groups/:id/auto-ownership-transfer", auth, updateAutoOwnershipTransfer);
groupRouter.get("/groups/:id/recent-actions", auth, getGroupRecentActions);
groupRouter.post("/groups/:id/boost", auth, boostGroup);
groupRouter.post("/groups/:id/livestream/start", auth, startLiveStream);
groupRouter.post("/groups/:id/livestream/end", auth, endLiveStream);
groupRouter.post("/groups/:id/livestream/raise-hand", auth, raiseHand);
groupRouter.post("/groups/:id/mini-app", auth, addMiniApp);
groupRouter.delete("/groups/:id/mini-app/:appId", auth, removeMiniApp);

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
