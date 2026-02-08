const express = require("express");
const {
  addStory,
  reactToStory,
  addViewToStory,
} = require("../Controllers/storyController");
const upload = require("../Middleware/multer");
const storyRouter = express.Router();

storyRouter.post(
  "/addStory",
  require("../Middleware/authMiddleware"),
  upload.single("media"),
  addStory,
);
storyRouter.post(
  "/reactStory/:storyId",
  require("../Middleware/authMiddleware"),
  reactToStory,
);
storyRouter.post(
  "/viewStory/:storyId",
  require("../Middleware/authMiddleware"),
  addViewToStory,
);
module.exports = storyRouter;
