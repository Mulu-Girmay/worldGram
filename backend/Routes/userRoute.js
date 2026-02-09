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
const { refresh, logout } = require("../Controllers/authController");
const userRouter = express.Router();
const auth = require("../Middleware/authMiddleware");
userRouter.post("/register", RegisterUser);
userRouter.post("/login", login);
userRouter.post("/refresh", refresh);
userRouter.post("/logout", logout);
userRouter.get("/me", auth, getMe);
userRouter.get("/users/:id", auth, getUserById);
userRouter.patch("/me", auth, updateProfile);
userRouter.patch("/me/privacy", auth, updatePrivacy);
userRouter.get("/users", auth, searchUsers);
userRouter.post("/users/block", auth, blockUser);
userRouter.post("/users/unblock", auth, unblockUser);
module.exports = userRouter;
