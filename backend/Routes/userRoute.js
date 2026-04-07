const express = require("express");
const {
  RegisterUser,
  login,
  getMe,
  getUserById,
  updateProfile,
  updatePrivacy,
  searchUsers,
  blockUser,
  unblockUser,
} = require("../Controllers/userControllers");
const userRouter = express.Router();
const auth = require("../Middleware/authMiddleware");
const upload = require("../Middleware/multer");
const { createRateLimiter } = require("../Middleware/rateLimit");

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyBuilder: (req) => `auth:${req.ip}:${req.path}`,
});

const moderateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyBuilder: (req) => `moderate:${req.userId || req.ip}`,
});

userRouter.post("/register", authLimiter, RegisterUser);
userRouter.post("/login", authLimiter, login);
userRouter.get("/me", auth, getMe);
userRouter.get("/users/:id", auth, getUserById);
userRouter.patch("/me", auth, upload.single("media"), updateProfile);
userRouter.patch("/me/privacy", auth, updatePrivacy);
userRouter.get("/users", auth, searchUsers);
userRouter.post("/users/block", auth, moderateLimiter, blockUser);
userRouter.post("/users/unblock", auth, moderateLimiter, unblockUser);
module.exports = userRouter;
