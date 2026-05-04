const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  // Try to get token from cookie first, then fall back to Authorization header
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = String(req.headers?.authorization || "");
    if (!authHeader) return res.sendStatus(401);
    const [scheme, value] = authHeader.split(" ");
    if (scheme !== "Bearer" || !value) return res.sendStatus(401);
    token = value;
  }

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!decoded?.userId) return res.sendStatus(403);
    req.userId = decoded.userId;
    next();
  } catch {
    res.sendStatus(403);
  }
};
