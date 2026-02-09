const express = require("express");
const auth = require("../Middleware/authMiddleware");
const {
  updateActivity,
  getActivityByUser,
} = require("../Controllers/activityController");

const activityRouter = express.Router();

activityRouter.post("/activity", auth, updateActivity);
activityRouter.get("/activity/:userId", auth, getActivityByUser);

module.exports = activityRouter;
