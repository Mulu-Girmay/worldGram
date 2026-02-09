const express = require("express");
const upload = require("../Middleware/multer");
const {
  addPost,
  editPost,
  reactToPost,
  addViewToPost,
  forwardPost,
  getChannelPosts,
  getChannelPostById,
  deletePost,
  pinPost,
  unpinPost,
} = require("../Controllers/channelPostController");
const postRouter = express.Router();
const auth = require("../Middleware/authMiddleware");

postRouter.post(
  "/addPost/:id",
  auth,
  upload.single("media"),
  addPost,
);
postRouter.patch(
  "/editPost/:channelId/:postId",
  auth,
  upload.single("media"),
  editPost,
);
postRouter.post(
  "/reactToPost/:channelId/:postId",
  auth,
  reactToPost,
);
postRouter.post(
  "/updateView/:channelId/:postId",
  auth,
  addViewToPost,
);
postRouter.post(
  "/forwardPost/:channelId/:postId",
  auth,
  forwardPost,
);
postRouter.get("/channels/:channelId/posts", auth, getChannelPosts);
postRouter.get(
  "/channels/:channelId/posts/:postId",
  auth,
  getChannelPostById,
);
postRouter.delete(
  "/channels/:channelId/posts/:postId",
  auth,
  deletePost,
);
postRouter.post("/channels/:channelId/posts/:postId/pin", auth, pinPost);
postRouter.post("/channels/:channelId/posts/:postId/unpin", auth, unpinPost);
module.exports = postRouter;
