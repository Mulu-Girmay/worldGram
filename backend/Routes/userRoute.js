const express = require("express");
const { RegisterUser, login } = require("../Controllers/userControllers");
const { refresh, logout } = require("../Controllers/authController");
const userRouter = express.Router();
userRouter.post("/register", RegisterUser);
userRouter.post("/login", login);
userRouter.post("/refresh", refresh);
userRouter.post("/logout", logout);
module.exports = userRouter;
