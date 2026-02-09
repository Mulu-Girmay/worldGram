const Contact = require("../Models/Contact");
const User = require("../Models/User");
const mongoose = require("mongoose");

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

exports.addContact = async (req, res) => {
  try {
    const { userId, username, nameOverride, isFavorite, isBlocked } = req.body;
    let contactUserId = userId;

    if (!contactUserId && username) {
      const user = await User.findOne({ "identity.username": username });
      if (!user) return res.status(404).json({ err: "User not found" });
      contactUserId = user._id;
    }
    if (!contactUserId) {
      return res.status(400).json({ err: "userId or username is required" });
    }

    const existing = await Contact.findOne({
      ownerUserId: req.userId,
      contactUserId,
    });
    if (existing) {
      return res.status(409).json({ err: "Contact already exists" });
    }

    const contact = await Contact.create({
      ownerUserId: req.userId,
      contactUserId,
      nameOverride: nameOverride || null,
      isFavorite: Boolean(isFavorite),
      isBlocked: Boolean(isBlocked),
    });

    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ err: "Failed to add contact" });
  }
};

exports.listContacts = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = { ownerUserId: req.userId };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const contacts = await Contact.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("contactUserId");

    const nextCursor =
      contacts.length === limit ? contacts[contacts.length - 1]._id : null;

    res.json({ items: contacts, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to list contacts" });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { nameOverride, isFavorite, isBlocked } = req.body;
    const contact = await Contact.findOne({
      _id: req.params.id,
      ownerUserId: req.userId,
    });
    if (!contact) return res.status(404).json({ err: "Contact not found" });

    if (typeof nameOverride === "string") contact.nameOverride = nameOverride;
    if (typeof isFavorite === "boolean") contact.isFavorite = isFavorite;
    if (typeof isBlocked === "boolean") contact.isBlocked = isBlocked;

    await contact.save();
    res.json({ message: "Contact updated", contact });
  } catch (err) {
    res.status(500).json({ err: "Failed to update contact" });
  }
};

exports.removeContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      ownerUserId: req.userId,
    });
    if (!contact) return res.status(404).json({ err: "Contact not found" });
    res.json({ message: "Contact removed" });
  } catch (err) {
    res.status(500).json({ err: "Failed to remove contact" });
  }
};
