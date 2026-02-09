const Chat = require("../Models/Chat");
const mongoose = require("mongoose");
const Message = require("../Models/Message");
const ChannelPost = require("../Models/ChannelPost");
const { reactToEntity } = require("../utils/reaction");
const { addViewToEntity } = require("../utils/view");
const { forwardEntity } = require("../utils/forward");
const Group = require("../Models/Group");

// Create private or group chat

exports.createChat = async (req, res) => {
  try {
    const { type, participants } = req.body;
    if (!type) {
      return res.status(400).json({
        err: "Please provide a chat type.",
      });
    }
    if (type === "private") {
      if (!Array.isArray(participants) || participants.length < 2) {
        return res.status(400).json({
          err: "Please provide two participants.",
        });
      }
      const uniqueParticipants = [...new Set(participants.map(String))];
      if (uniqueParticipants.length !== 2) {
        return res.status(400).json({
          err: "Private chats must include exactly two unique participants.",
        });
      }
      const existingChat = await Chat.findOne({
        type: "private",
        participants: { $all: uniqueParticipants, $size: 2 },
      });
      if (existingChat) {
        return res.status(409).json({
          err: "A private chat between these participants already exists.",
          chatId: existingChat._id,
        });
      }
      const chat = await Chat.create({
        type,
        participants: [...new Set(participants)],
      });
    } else if (type === "group") {
      let group = await Group.findOne({
        _id: req.params.groupId,
      });
      participants = group.members.members;
      if (!participants) {
        return res.status(400).json({
          err: "failed to fetch members.",
        });
      }
      const chat = await Chat.create({
        type,
        participants: participants,
        groupId: req.params.groupId,
      });
    }

    res.status(201).json({ message: "successfully created chat" });
  } catch (err) {
    res.status(500).json({ err: "Failed to create chat. Please try again." });
  }
};
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, text } = req.body;
    if (!chatId || !senderId || !text) {
      return res.status(400).json({
        err: "chatId, senderId, and text are required to send a message.",
      });
    }

    // Save message
    const message = await Message.create({
      identity: {
        chatId,
        senderId,
      },
      content: {
        ContentType: "text",
        text,
      },
    });

    // Update last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessageId: message._id,
    });

    // Emit via socket
    const io = req.app.get("io");
    io.to(chatId).emit("new-message", message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ err: "Failed to send message. Please try again." });
  }
};
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ err: "chatId is required." });
    }

    const messages = await Message.find({
      "identity.chatId": chatId,
      "state.isDeleted": false,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res
      .status(500)
      .json({ err: "Failed to fetch messages. Please try again." });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const result = await reactToEntity({
      Model: Message,
      findQuery: {
        _id: req.params.messageId,
        "identity.chatId": req.params.chatId,
      },
      userId: req.userId,
      emoji: req.body.emoji,
      reactionsPath: "reactions",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.addViewToMessage = async (req, res) => {
  try {
    const result = await addViewToEntity({
      Model: Message,
      findQuery: {
        _id: req.params.messageId,
        "identity.chatId": req.params.chatId,
      },
      userId: req.userId,
      viewersPath: "state.readBy",
      notFoundMessage: "Message not found",
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

exports.forwardMessage = async (req, res) => {
  try {
    const targ = req.body.destination;
    if (!targ || !targ.type || !targ.id) {
      return res.status(400).json({ err: "Destination required!" });
    }

    let targetModel;
    if (targ.type === "channel") {
      targetModel = ChannelPost;
    } else if (targ.type === "chat" || targ.type === "group") {
      targetModel = Message;
    } else {
      return res.status(400).json({ err: "Invalid destination type" });
    }

    const forwardedMessage = await Message.findOne({
      _id: req.params.messageId,
      "identity.chatId": req.params.chatId,
    });
    if (!forwardedMessage) {
      return res.status(404).json({ err: "Message not found" });
    }

    const hasText = Boolean(forwardedMessage.content?.text);
    const hasMedia = Boolean(forwardedMessage.content?.mediaURL);
    if (!hasText && !hasMedia) {
      return res.status(400).json({ err: "Cannot forward empty message" });
    }

    const original = {
      type: "message",
      id: forwardedMessage._id,
      authorId: forwardedMessage.identity?.senderId,
    };

    let snapshot;
    if (targetModel === ChannelPost) {
      snapshot = {
        channelId: targ.id,
        authorId: req.userId,
        text: forwardedMessage.content?.text || null,
        media: hasMedia
          ? [
              {
                url: forwardedMessage.content.mediaURL,
                type: forwardedMessage.content.ContentType || null,
                size: forwardedMessage.content.fileSize || null,
              },
            ]
          : [],
      };
    } else {
      snapshot = {
        identity: { chatId: targ.id, senderId: req.userId },
        content: {
          ContentType: forwardedMessage.content?.ContentType || "text",
          text: forwardedMessage.content?.text || null,
          mediaURL: forwardedMessage.content?.mediaURL || null,
          fileName: forwardedMessage.content?.fileName || null,
          fileSize: forwardedMessage.content?.fileSize || null,
          duration: forwardedMessage.content?.duration || null,
        },
      };
    }

    const result = await forwardEntity({
      SourceModel: Message,
      TargetModel: targetModel,
      findQuery: {
        _id: req.params.messageId,
        "identity.chatId": req.params.chatId,
      },
      userId: req.userId,
      destination: targ,
      original,
      snapshot,
    });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
};

const parseLimit = (value, fallback = 20, max = 50) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

exports.listChats = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);
    const query = { participants: req.userId };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const chats = await Chat.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("lastMessageId");

    const nextCursor =
      chats.length === limit ? chats[chats.length - 1]._id : null;

    res.json({ items: chats, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to list chats." });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate("lastMessageId");
    if (!chat) return res.status(404).json({ err: "Chat not found." });

    const isParticipant = chat.participants
      .map((id) => id.toString())
      .includes(req.userId);
    if (!isParticipant) {
      return res.status(403).json({ err: "Not allowed to view this chat." });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ err: "Failed to get chat." });
  }
};

exports.getMessagesPaged = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { cursor } = req.query;
    const limit = parseLimit(req.query.limit);

    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ err: "Chat not found." });
    const isParticipant = chat.participants
      .map((id) => id.toString())
      .includes(req.userId);
    if (!isParticipant) {
      return res.status(403).json({ err: "Not allowed to view messages." });
    }

    const query = {
      "identity.chatId": chatId,
      "state.isDeleted": false,
    };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit);

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1]._id : null;

    res.json({ items: messages, nextCursor });
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch messages." });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ err: "Text is required." });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ err: "Message not found." });
    if (message.identity.chatId.toString() !== chatId) {
      return res.status(400).json({ err: "Message not in this chat." });
    }
    if (message.identity.senderId.toString() !== req.userId) {
      return res.status(403).json({ err: "Not allowed to edit." });
    }

    message.content.text = text;
    message.state.isEdited = true;
    await message.save();

    res.json({ message: "Message edited.", data: message });
  } catch (err) {
    res.status(500).json({ err: "Failed to edit message." });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ err: "Message not found." });
    if (message.identity.chatId.toString() !== chatId) {
      return res.status(400).json({ err: "Message not in this chat." });
    }
    if (message.identity.senderId.toString() !== req.userId) {
      return res.status(403).json({ err: "Not allowed to delete." });
    }

    message.state.isDeleted = true;
    message.content.text = null;
    message.content.mediaURL = null;
    await message.save();

    res.json({ message: "Message deleted." });
  } catch (err) {
    res.status(500).json({ err: "Failed to delete message." });
  }
};

exports.sendMediaMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    if (!req.file && !text) {
      return res.status(400).json({ err: "Text or media is required." });
    }

    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ err: "Chat not found." });
    const isParticipant = chat.participants
      .map((id) => id.toString())
      .includes(req.userId);
    if (!isParticipant) {
      return res.status(403).json({ err: "Not allowed to send message." });
    }

    const message = await Message.create({
      identity: { chatId, senderId: req.userId },
      content: {
        ContentType: req.file
          ? req.file.mimetype.startsWith("image/")
            ? "image"
            : req.file.mimetype.startsWith("video/")
              ? "video"
              : "file"
          : "text",
        text: text || null,
        mediaURL: req.file
          ? `/${req.file.destination.replace(/\\\\/g, "/")}/${req.file.filename}`
          : null,
        fileName: req.file ? req.file.originalname : null,
        fileSize: req.file ? req.file.size : null,
      },
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessageId: message._id,
    });

    const io = req.app.get("io");
    io.to(chatId).emit("new-message", message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ err: "Failed to send media message." });
  }
};

exports.markChatRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ err: "Chat not found." });
    const isParticipant = chat.participants
      .map((id) => id.toString())
      .includes(req.userId);
    if (!isParticipant) {
      return res.status(403).json({ err: "Not allowed." });
    }

    await Message.updateMany(
      {
        "identity.chatId": chatId,
        "state.isDeleted": false,
        "state.readBy": { $ne: req.userId },
      },
      { $addToSet: { "state.readBy": req.userId } },
    );

    res.json({ message: "Chat marked as read." });
  } catch (err) {
    res.status(500).json({ err: "Failed to mark read." });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ err: "Chat not found." });
    const isParticipant = chat.participants
      .map((id) => id.toString())
      .includes(req.userId);
    if (!isParticipant) {
      return res.status(403).json({ err: "Not allowed." });
    }

    const count = await Message.countDocuments({
      "identity.chatId": chatId,
      "state.isDeleted": false,
      "state.readBy": { $ne: req.userId },
      "identity.senderId": { $ne: req.userId },
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ err: "Failed to get unread count." });
  }
};

exports.updateChatSettings = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isPinned, isMuted } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ err: "Chat not found." });
    const isParticipant = chat.participants
      .map((id) => id.toString())
      .includes(req.userId);
    if (!isParticipant) {
      return res.status(403).json({ err: "Not allowed." });
    }

    if (typeof isPinned === "boolean") chat.isPinned = isPinned;
    if (typeof isMuted === "boolean") chat.isMuted = isMuted;
    await chat.save();

    res.json({ message: "Chat settings updated.", chat });
  } catch (err) {
    res.status(500).json({ err: "Failed to update chat settings." });
  }
};
