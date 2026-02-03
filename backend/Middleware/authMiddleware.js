const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.sendStatus(403);
  }
};
