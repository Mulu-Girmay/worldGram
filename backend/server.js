const mongoose = require("mongoose");
const app = require("./app");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const PORT = process.env.PORT;
const URI = process.env.MONGO_URI;
const userRouter = require("./Routes/userRoute");
const channelRouter = require("./Routes/channelRoute");
const groupRouter = require("./Routes/groupRouter");
app.use(cookieParser());
app.use("/api", userRouter);
app.use("/api", channelRouter);
app.use("/api", groupRouter);

const connectdb = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("Mongo Successfully Connected");
  } catch (err) {
    console.log("error:", err.message);
  }
};

app.listen(PORT, async () => {
  await connectdb(URI);
  console.log(`server is running at port ${PORT}`);
});
