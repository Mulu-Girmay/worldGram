const express = require("express");
const {
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  addAdmin,
  removeAdmin,
} = require("../Controllers/groupController");
const groupRouter = express.Router();
groupRouter.post(
  "/addGroup",
  require("../Middleware/authMiddleware"),
  createGroup,
);
groupRouter.patch(
  "/updateGroup/:id",
  require("../Middleware/authMiddleware"),
  updateGroup,
);
groupRouter.delete(
  "/deleteGroup/:id",
  require("../Middleware/authMiddleware"),
  deleteGroup,
);
groupRouter.post(
  "/addMember/:id",
  require("../Middleware/authMiddleware"),
  addMember,
);
groupRouter.post(
  "/addGroupAdmin/:id",
  require("../Middleware/authMiddleware"),
  addAdmin,
);
groupRouter.post(
  "/removeAdmin/:id",
  require("../Middleware/authMiddleware"),
  removeAdmin,
);
module.exports = groupRouter;
