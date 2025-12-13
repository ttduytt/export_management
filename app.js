// app.js (ESM version)
import express from "express";
import path from "node:path";
import dotenv from "dotenv";
import apiRouter from "./routes/api.js";
import router from "./routes/index.js";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

// Cấu hình __dirname vì trong ESM không có sẵn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load biến môi trường
dotenv.config();

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(cookieParser());

// API routes
app.use("/exportmanagement", apiRouter);

// Main router
app.use("/", router);

// Chạy server
const PORT = process.env.PORT || 8001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

export default app;
