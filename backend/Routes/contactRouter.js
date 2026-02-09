const express = require("express");
const auth = require("../Middleware/authMiddleware");
const {
  addContact,
  listContacts,
  updateContact,
  removeContact,
} = require("../Controllers/contactController");

const contactRouter = express.Router();

contactRouter.post("/contacts", auth, addContact);
contactRouter.get("/contacts", auth, listContacts);
contactRouter.patch("/contacts/:id", auth, updateContact);
contactRouter.delete("/contacts/:id", auth, removeContact);

module.exports = contactRouter;
