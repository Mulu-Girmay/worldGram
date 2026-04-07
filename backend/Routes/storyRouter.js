const express = require("express");
const {
  addStory,
  reactToStory,
  addViewToStory,
  getStoryById,
  listStories,
  listUserStories,
  listHighlights,
  updateStory,
  deleteStory,
} = require("../Controllers/storyController");
const upload = require("../Middleware/multer");
const storyRouter = express.Router();
const auth = require("../Middleware/authMiddleware");
const { createRateLimiter } = require("../Middleware/rateLimit");

const storyWriteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  keyBuilder: (req) => `story-write:${req.userId || req.ip}`,
});

const storyReactLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyBuilder: (req) => `story-react:${req.userId || req.ip}`,
});

storyRouter.post(
  "/addStory",
  auth,
  storyWriteLimiter,
  upload.single("media"),
  addStory,
);
storyRouter.post("/reactStory/:storyId", auth, storyReactLimiter, reactToStory);
storyRouter.post(
  "/viewStory/:storyId",
  auth,
  storyReactLimiter,
  addViewToStory,
);
storyRouter.get("/stories", auth, listStories);
storyRouter.get("/stories/:storyId", auth, getStoryById);
storyRouter.get("/users/:userId/stories", auth, listUserStories);
storyRouter.get("/users/:userId/highlights", auth, listHighlights);
storyRouter.patch("/stories/:storyId", auth, storyWriteLimiter, updateStory);
storyRouter.delete("/stories/:storyId", auth, storyWriteLimiter, deleteStory);
module.exports = storyRouter;
