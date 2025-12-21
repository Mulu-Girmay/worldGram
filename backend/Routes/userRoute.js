const express = require("express");
const { RegisterUser, login } = require("../Controllers/userControllers");
const userRouter = express.Router();
userRouter.post("/register", RegisterUser);
userRouter.post("/login", login);
module.exports = userRouter;
