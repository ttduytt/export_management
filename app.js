// app.js (ESM version)
import express from "express";
import path from "node:path";
import dotenv from "dotenv";
import apiRouter from "./routes/api.js";
import router from "./routes/index.js";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "node:http";
import { connectRedis } from "./public/js/redisClient.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  /* options */
});

// cấu hình socket
io.on("connection", (socket) => {
  socket.on("joinRoom", (factory) => {
    socket.join(factory);
  });

  // Lắng nghe sự kiện cập nhật đơn hàng thành công và phát lại cho các client trong phòng tương ứng
  socket.on("deliveryUpdated", (data) => {
    socket.to(data.factory).emit("getDeliveryUpdate", data.factory);
    socket.to("v4").emit("getDeliveryUpdate", data.factory);
  });
});

// Cấu hình __dirname vì trong ESM không có sẵn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectRedis();

// Load biến môi trường
dotenv.config();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(cookieParser());

// API routes
app.use("/exportmanagement", apiRouter);

// Main router
app.use("/", router);

// Chạy server
const PORT = process.env.PORT || 8001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

export default server;
