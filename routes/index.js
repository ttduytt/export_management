const express = require("express");
const router = express.Router();
const path = require("path");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../views/Login.html"));
});

router.get("/home", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../views/Home.html"));
});

router.get("/delivery", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../views/Delivery.html"));
});

router.get("/deliveryHistory", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../views/DeliveryHistory.html"));
});

router.get("/admin", function (req, res, next) {
  res.sendFile(path.join(__dirname, "../views/Admin.html"));
});

module.exports = router;
