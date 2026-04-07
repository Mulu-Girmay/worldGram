const express = require("express");
const auth = require("../Middleware/authMiddleware");
const {
  addContact,
  listContacts,
  updateContact,
  removeContact,
} = require("../Controllers/contactController");
const { createRateLimiter } = require("../Middleware/rateLimit");

const contactRouter = express.Router();

const moderateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  keyBuilder: (req) => `contact:${req.userId || req.ip}`,
});

contactRouter.post("/contacts", auth, moderateLimiter, addContact);
contactRouter.get("/contacts", auth, moderateLimiter, listContacts);
contactRouter.patch("/contacts/:id", auth, moderateLimiter, updateContact);
contactRouter.delete("/contacts/:id", auth, moderateLimiter, removeContact);

module.exports = contactRouter;
