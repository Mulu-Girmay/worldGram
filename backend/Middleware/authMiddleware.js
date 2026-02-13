const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  // Try to get token from cookie first, then fall back to Authorization header
  let token = req.cookies.accessToken;
  
  if (!token) {
    const auth = req.headers.authorization;
    if (!auth) return res.sendStatus(401);
    token = auth.split(" ")[1];
  }
  
  if (!token) return res.sendStatus(401);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.sendStatus(403);
  }
};
