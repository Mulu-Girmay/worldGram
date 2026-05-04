const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = require("./app");
const chatRouter = require("./Routes/chatRouter");
const Chat = require("./Models/Chat");
const Channel = require("./Models/Channel");
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
const PORT = Number(process.env.PORT || 3000);
const URI = process.env.MONGO_URI;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const userRouter = require("./Routes/userRoute");
const authRouter = require("./Routes/authRoute");
const channelRouter = require("./Routes/channelRoute");
const groupRouter = require("./Routes/groupRouter");
const postRouter = require("./Routes/postRouter");
const storyRouter = require("./Routes/storyRouter");
const contactRouter = require("./Routes/contactRouter");
const notificationRouter = require("./Routes/notificationRouter");
const activityRouter = require("./Routes/activityRouter");
app.use(cookieParser());
app.use("/api", authRouter);
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
  res
    .status(404)
    .json({ err: `Route not found: ${req.method} ${req.originalUrl}` });
});
app.use((err, req, res, next) => {
  const status = Number(err?.statusCode || err?.status || 500);
  const safeStatus = Number.isInteger(status) && status >= 400 ? status : 500;
  const isServerError = safeStatus >= 500;
  const message =
    err?.err ||
    err?.message ||
    (isServerError ? "Internal server error" : "Request failed");

  console.error("request error:", {
    method: req.method,
    url: req.originalUrl,
    status: safeStatus,
    message,
  });

  const payload = { err: message };
  if (process.env.NODE_ENV !== "production" && err?.stack) {
    payload.details = err.stack;
  }
  res.status(safeStatus).json(payload);
});

const connectdb = async (uri) => {
  try {
    mongoose.set("strictQuery", true);
    mongoose.set("sanitizeFilter", true);
    await mongoose.connect(uri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 100),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
      serverSelectionTimeoutMS: Number(
        process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000,
      ),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
    });
    console.info("Mongo Successfully Connected");
  } catch (err) {
    console.error("DB connection error:", err.message);
    throw err;
  }
};

if (!URI) {
  throw new Error("Missing required env var: MONGO_URI");
}
if (!JWT_ACCESS_SECRET) {
  throw new Error("Missing required env var: JWT_ACCESS_SECRET");
}
if (!JWT_REFRESH_SECRET) {
  throw new Error("Missing required env var: JWT_REFRESH_SECRET");
}

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
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    socket.userId = decoded.userId;
    return next();
  } catch {
    return next(new Error("Forbidden"));
  }
});
// Socket logic
io.on("connection", (socket) => {
  console.info("User connected:", socket.id);
  User.findByIdAndUpdate(socket.userId, {
    "AccountStatus.onlineStatus": "online",
  }).catch((err) => console.error("socket online status error:", err.message));
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
      console.info(`Socket ${socket.id} joined chat ${chatId}`);
    } catch (err) {
      console.error("socket join-chat error:", err.message);
    }
  });

  socket.on("join-channel", async (channelId) => {
    try {
      if (!channelId) return;
      const channel = await Channel.findById(channelId).select(
        "settings.isPublic audience.subscribers ownership.admins ownership.ownerId",
      );
      if (!channel) return;
      const uid = String(socket.userId || "");
      const subscribers = (channel?.audience?.subscribers || []).map((id) =>
        id.toString(),
      );
      const admins = (channel?.ownership?.admins || []).map((id) =>
        id.toString(),
      );
      const isOwner = channel?.ownership?.ownerId?.toString?.() === uid;
      const isAllowed =
        Boolean(channel?.settings?.isPublic) ||
        subscribers.includes(uid) ||
        admins.includes(uid) ||
        isOwner;
      if (!isAllowed) return;

      const room = `channel:${channelId}`;
      socket.join(room);
      console.info(`Socket ${socket.id} joined channel room ${room}`);
    } catch (err) {
      console.error("socket join-channel error:", err.message);
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
      console.error("socket typing error:", err.message);
    }
  });
  // Message creation is handled by REST controllers to keep one validation path.
  socket.on("send-message", () => {
    socket.emit("message-error", {
      err: "Direct socket send-message is deprecated. Use REST /api/chats/:chatId/message.",
    });
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
      console.error("socket offline status error:", err.message);
    }
    console.info("User disconnected:", socket.id);
  });
});
server.listen(PORT, async () => {
  await connectdb(URI);
  console.info(`server is running at port ${PORT}`);
});

server.keepAliveTimeout = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 65000);
server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 66000);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
