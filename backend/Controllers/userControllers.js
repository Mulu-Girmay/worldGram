const User = require("../Models/User");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
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
    newUser.save();
    return res.status(202).json({ newUser });
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
    console.log(user.identity.password);
    if (!user) {
      return res.status(404).json({ message: "Phone Number Not found" });
    }
    const isMatch = await bcrypt.compare(password, user.identity.password);
    if (!isMatch) {
      return res.status(200).json({ users: user, message: "Wrong Password" });
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
    return res
      .status(200)
      .json({ accessToken, users: user, message: "Login Successful" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
