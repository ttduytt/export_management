// app.js (ESM version)
import express from "express";
import path from "node:path";
import dotenv from "dotenv";
import apiRouter from "./routes/api.js";
import router from "./routes/index.js";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import https from "node:https";
import fs from "node:fs";

const app = express();

// Đọc chứng chỉ tự cấp (SSL)
const pfxPath = path.join(process.cwd(), 'cert.pfx');

let serverOptions = {};
try {
  serverOptions = {
    pfx: fs.readFileSync(pfxPath),
    passphrase: 'password'
  };
} catch (error) {
  console.warn("⚠️ Không tìm thấy cert.pfx. Hãy tạo bằng script PowerShell.");
}

const server = https.createServer(serverOptions, app);

// Cấu hình __dirname vì trong ESM không có sẵn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Load biến môi trườnga
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
  console.log(`✅ Server is running on https://localhost:${PORT} (HTTPS)`);
});

export default server;
