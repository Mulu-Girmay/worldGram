const express = require("express");
const upload = require("../Middleware/multer");
const { addPost } = require("../Controllers/channelPostController");
const postRouter = express.Router();

postRouter.post(
  "/addPost/:id",
  require("../Middleware/authMiddleware"),
  upload.single("media"),
  addPost,
);
module.exports = postRouter;
