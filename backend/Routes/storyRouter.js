const express = require("express");
const {
  addStory,
  reactToStory,
  addViewToStory,
  getStoryById,
  listStories,
  listUserStories,
  deleteStory,
} = require("../Controllers/storyController");
const upload = require("../Middleware/multer");
const storyRouter = express.Router();
const auth = require("../Middleware/authMiddleware");

storyRouter.post(
  "/addStory",
  auth,
  upload.single("media"),
  addStory,
);
storyRouter.post(
  "/reactStory/:storyId",
  auth,
  reactToStory,
);
storyRouter.post(
  "/viewStory/:storyId",
  auth,
  addViewToStory,
);
storyRouter.get("/stories", auth, listStories);
storyRouter.get("/stories/:storyId", auth, getStoryById);
storyRouter.get("/users/:userId/stories", auth, listUserStories);
storyRouter.delete("/stories/:storyId", auth, deleteStory);
module.exports = storyRouter;
