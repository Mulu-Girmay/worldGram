const Chat = require("../Models/Chat");
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
    } else if (type === "group") {
      let group = await Group.findOne({
        _id: req.params.groupId,
      });
      participants = group.members.members;
    }

    const chat = await Chat.create({
      type,
      participants: [...new Set(participants)],
    });

    res.status(201).json(chat);
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
