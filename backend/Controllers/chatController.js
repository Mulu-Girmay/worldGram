const Chat = require("../Models/Chat");
const Message = require("../Models/Message");

// Create private or group chat
exports.createChat = async (req, res) => {
  try {
    const { type, participants } = req.body;
    if (!type || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({
        err: "Please provide a chat type and at least two participants.",
      });
    }
    if (type === "private") {
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
    res.status(500).json({ err: "Failed to fetch messages. Please try again." });
  }
};
