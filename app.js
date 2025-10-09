const express = require('express');
const path = require('path');
const apiRouter = require('./routes/api');

require('dotenv').config();

var router = require('./routes/index');

const app = express();

// api
app.use('/exportmanagemnt', apiRouter);

// router
app.use('/', router);

// 🔹 Chạy server ở cổng .env hoặc 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
