const User = require("../Models/User");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const sanitizeUser = (user) => {
  const u = user.toObject ? user.toObject() : user;
  if (u.identity) {
    delete u.identity.password;
    delete u.identity.refreshToken;
  }
  return u;
};
let hashPassword = async (plainPassword) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  return hash;
};
exports.RegisterUser = async (req, res) => {
  const { phoneNumber, password, username, firstName, lastName, Bio } =
    req.body;
  let hashedPassword = await hashPassword(password);
  try {
    let newUser = new User({
      identity: {
        phoneNumber: phoneNumber,
        password: hashedPassword,
        username: username,
        firstName: firstName,
        lastName: lastName,
        Bio: Bio,
      },
    });
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.status(202).json({
      user: sanitizeUser(newUser),
      accessToken,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({
      "identity.phoneNumber": phoneNumber,
    });
    if (!user) {
      return res.status(404).json({ message: "Phone Number Not found" });
    }
    const isMatch = await bcrypt.compare(password, user.identity.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong Password" });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res
      .status(200)
      .json({
        user: sanitizeUser(user),
        accessToken,
        message: "Login Successful",
      });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// sanitizeUser moved to top

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ err: "User not found" });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch profile" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ err: "User not found" });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch user" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      Bio,
      profileUrl,
      phoneNumber,
      bioLink,
      personalChannelUsername,
      emojiStatus,
      isPremium,
    } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ err: "User not found" });

    if (typeof firstName === "string") user.identity.firstName = firstName;
    if (typeof lastName === "string") user.identity.lastName = lastName;
    if (typeof username === "string") user.identity.username = username;
    if (typeof phoneNumber === "string") user.identity.phoneNumber = phoneNumber;
    if (typeof Bio === "string") user.identity.Bio = Bio;
    if (typeof bioLink === "string") user.identity.bioLink = bioLink;
    if (typeof personalChannelUsername === "string") {
      user.identity.personalChannelUsername = personalChannelUsername;
    }
    if (typeof emojiStatus === "string") {
      user.identity.emojiStatus = emojiStatus;
    }
    if (typeof isPremium === "boolean") {
      user.AccountStatus.isPremium = isPremium;
    } else if (typeof isPremium === "string") {
      const normalized = isPremium.trim().toLowerCase();
      if (normalized === "true" || normalized === "false") {
        user.AccountStatus.isPremium = normalized === "true";
      }
    }
    if (req.file?.filename) {
      user.identity.profileUrl = req.file.filename;
    } else if (typeof profileUrl === "string") {
      user.identity.profileUrl = profileUrl;
    }

    await user.save();
    res.json({ message: "Profile updated", user: sanitizeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ err: "Username already exists" });
    }
    res.status(500).json({ err: "Failed to update profile" });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { privacyLastSeen, privacyProfilePhoto, privacyPhoneNumber } =
      req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ err: "User not found" });

    if (privacyLastSeen) user.privacySettings.privacyLastSeen = privacyLastSeen;
    if (privacyProfilePhoto)
      user.privacySettings.privacyProfilePhoto = privacyProfilePhoto;
    if (privacyPhoneNumber)
      user.privacySettings.privacyPhoneNumber = privacyPhoneNumber;

    await user.save();
    res.json({ message: "Privacy updated", privacy: user.privacySettings });
  } catch (err) {
    res.status(500).json({ err: "Failed to update privacy" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const query = {
      _id: { $ne: req.userId },
    };

    if (q) {
      query.$or = [
        { "identity.username": { $regex: q, $options: "i" } },
        { "identity.phoneNumber": { $regex: q, $options: "i" } },
        { "identity.firstName": { $regex: q, $options: "i" } },
        { "identity.lastName": { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ _id: -1 }).limit(limit);
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ err: "Failed to search users" });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ err: "User not found" });
    if (!user.security.blockedUsers) user.security.blockedUsers = [];
    if (!user.security.blockedUsers.includes(userId)) {
      user.security.blockedUsers.push(userId);
    }
    await user.save();
    res.json({ message: "User blocked" });
  } catch (err) {
    res.status(500).json({ err: "Failed to block user" });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ err: "User not found" });
    user.security.blockedUsers = (user.security.blockedUsers || []).filter(
      (id) => id.toString() !== userId,
    );
    await user.save();
    res.json({ message: "User unblocked" });
  } catch (err) {
    res.status(500).json({ err: "Failed to unblock user" });
  }
};
