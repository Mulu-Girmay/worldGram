const User = require("../Models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.sendStatus(403);
    }

    const newAccess = generateAccessToken(user._id);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", newAccess, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });

    res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    res.sendStatus(403);
  }
};

exports.logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({ message: "No refresh token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    await User.findByIdAndUpdate(decoded.userId, {
      refreshToken: null,
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res
      .status(401)
      .json({ message: "Invalid refresh token", error: err.message });
  }
};
