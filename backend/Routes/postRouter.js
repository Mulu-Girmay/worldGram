const express = require("express");
const upload = require("../Middleware/multer");
const {
  addPost,
  editPost,
  reactToPost,
  addViewToPost,
  forwardPost,
} = require("../Controllers/channelPostController");
const postRouter = express.Router();

postRouter.post(
  "/addPost/:id",
  require("../Middleware/authMiddleware"),
  upload.single("media"),
  addPost,
);
postRouter.patch(
  "/editPost/:channelId/:postId",
  require("../Middleware/authMiddleware"),
  upload.single("media"),
  editPost,
);
postRouter.post(
  "/reactToPost/:channelId/:postId",
  require("../Middleware/authMiddleware"),
  reactToPost,
);
postRouter.post(
  "/updateView/:channelId/:postId",
  require("../Middleware/authMiddleware"),
  addViewToPost,
);
postRouter.post(
  "/forwardPost/:channelId/:postId",
  require("../Middleware/authMiddleware"),
  forwardPost,
);
module.exports = postRouter;
