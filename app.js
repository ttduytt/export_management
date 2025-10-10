const express = require("express");
const path = require("path");
const apiRouter = require("./routes/api");

require("dotenv").config();

const router = require("./routes/index");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// api
app.use("/exportmanagement", apiRouter);

// router
app.use("/", router);

// 🔹 Chạy server ở cổng .env hoặc 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
