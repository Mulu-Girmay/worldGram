const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");
const chatRouter = require("./Routes/chatRouter");
const Chat = require("./Models/Chat");
const Message = require("./Models/Message");
const User = require("./Models/User");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
});
app.set("io", io);
app.use("/api/chats", chatRouter);
const cookieParser = require("cookie-parser");
require("dotenv").config();
const PORT = process.env.PORT;
const URI = process.env.MONGO_URI;
const userRouter = require("./Routes/userRoute");
const channelRouter = require("./Routes/channelRoute");
const groupRouter = require("./Routes/groupRouter");
const postRouter = require("./Routes/postRouter");
const storyRouter = require("./Routes/storyRouter");
const contactRouter = require("./Routes/contactRouter");
const notificationRouter = require("./Routes/notificationRouter");
const activityRouter = require("./Routes/activityRouter");
app.use(cookieParser());
app.use("/api", userRouter);
app.use("/api", channelRouter);
app.use("/api", groupRouter);
app.use("/api", postRouter);
app.use("/api", storyRouter);
app.use("/api", contactRouter);
app.use("/api", notificationRouter);
app.use("/api", activityRouter);
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});
app.use((req, res) => {
  res.status(404).json({ err: "Route not found" });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ err: "Internal server error" });
});

const connectdb = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("Mongo Successfully Connected");
  } catch (err) {
    console.log("error:", err.message);
  }
};
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers?.cookie || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("accessToken="))
    ?.split("=")[1];

  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1] ||
    cookieToken;
  if (!token) return next(new Error("Unauthorized"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.userId;
    return next();
  } catch {
    return next(new Error("Forbidden"));
  }
});
// Socket logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  User.findByIdAndUpdate(socket.userId, {
    "AccountStatus.onlineStatus": "online",
  }).catch((err) => console.log("socket online status error:", err.message));
  io.emit("user-status", {
    userId: socket.userId,
    onlineStatus: "online",
  });

  // Join a chat room
  socket.on("join-chat", async (chatId) => {
    try {
      if (!chatId) return;
      const chat = await Chat.findById(chatId).select("participants");
      const isParticipant = chat?.participants?.some(
        (id) => id.toString() === socket.userId,
      );
      if (!isParticipant) return;

      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    } catch (err) {
      console.log("socket join-chat error:", err.message);
    }
  });

  socket.on("join-channel", (channelId) => {
    try {
      if (!channelId) return;
      const room = `channel:${channelId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined channel room ${room}`);
    } catch (err) {
      console.log("socket join-channel error:", err.message);
    }
  });

  socket.on("typing", async (payload) => {
    try {
      const chatId = payload?.chatId;
      const isTyping = Boolean(payload?.isTyping);
      if (!chatId) return;
      const chat = await Chat.findById(chatId).select("participants");
      const isParticipant = chat?.participants?.some(
        (id) => id.toString() === socket.userId,
      );
      if (!isParticipant) return;
      socket.to(chatId).emit("chat-typing", {
        chatId,
        userId: socket.userId,
        isTyping,
      });
    } catch (err) {
      console.log("socket typing error:", err.message);
    }
  });
  // Listen for new messages
  socket.on("send-message", async (data) => {
    try {
      const { chatId, text } = data || {};
      if (!chatId || !text) return;

      const chat = await Chat.findById(chatId).select("participants");
      const isParticipant = chat?.participants?.some(
        (id) => id.toString() === socket.userId,
      );
      if (!isParticipant) return;

      const message = await Message.create({
        identity: { chatId, senderId: socket.userId },
        state: { readBy: [socket.userId] },
        content: { ContentType: "text", text },
      });

      await Chat.findByIdAndUpdate(chatId, {
        lastMessageId: message._id,
      });

      const hydratedMessage = await Message.findById(message._id).populate({
        path: "identity.senderId",
        select:
          "identity.firstName identity.lastName identity.username identity.profileUrl AccountStatus.onlineStatus",
      });

      io.to(chatId).emit("new-message", hydratedMessage);
    } catch (err) {
      console.log("socket send-message error:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    try {
      await User.findByIdAndUpdate(socket.userId, {
        "AccountStatus.onlineStatus": "offline",
        "AccountStatus.lastSeenAt": new Date(),
      });
      io.emit("user-status", {
        userId: socket.userId,
        onlineStatus: "offline",
        lastSeenAt: new Date(),
      });
    } catch (err) {
      console.log("socket offline status error:", err.message);
    }
    console.log("User disconnected:", socket.id);
  });
});
server.listen(PORT, async () => {
  await connectdb(URI);
  console.log(`server is running at port ${PORT}`);
});
