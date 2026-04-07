const express = require("express");
const { refresh, logout } = require("../Controllers/authController");
const { createRateLimiter } = require("../Middleware/rateLimit");

const authRouter = express.Router();

const tokenLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyBuilder: (req) => `token:${req.ip}:${req.path}`,
});

authRouter.post("/refresh", tokenLimiter, refresh);
authRouter.post("/logout", tokenLimiter, logout);

module.exports = authRouter;
