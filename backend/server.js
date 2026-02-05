const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");
const chatRouter = require("./Routes/chatRouter");
const Chat = require("./Models/Chat");
const Message = require("./Models/Message");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
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
app.use(cookieParser());
app.use("/api", userRouter);
app.use("/api", channelRouter);
app.use("/api", groupRouter);
app.use("/api", postRouter);

const connectdb = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("Mongo Successfully Connected");
  } catch (err) {
    console.log("error:", err.message);
  }
};
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];
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

  // Join a chat room
  socket.on("join-chat", async (chatId) => {
    try {
      if (!chatId) return;
      const chat = await Chat.findById(chatId).select("participants");
      const isParticipant = chat?.participants?.some(
        (id) => id.toString() === socket.userId
      );
      if (!isParticipant) return;

      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    } catch (err) {
      console.log("socket join-chat error:", err.message);
    }
  });
  // Listen for new messages
  socket.on("send-message", async (data) => {
    try {
      const { chatId, text } = data || {};
      if (!chatId || !text) return;

      const chat = await Chat.findById(chatId).select("participants");
      const isParticipant = chat?.participants?.some(
        (id) => id.toString() === socket.userId
      );
      if (!isParticipant) return;

      const message = await Message.create({
        identity: { chatId, senderId: socket.userId },
        content: { ContentType: "text", text },
      });

      await Chat.findByIdAndUpdate(chatId, {
        lastMessageId: message._id,
      });

      io.to(chatId).emit("new-message", message);
    } catch (err) {
      console.log("socket send-message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
server.listen(PORT, async () => {
  await connectdb(URI);
  console.log(`server is running at port ${PORT}`);
});
