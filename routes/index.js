const express = require('express');
const router = express.Router();
const path = require('path'); 

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../views/Home.html'));
});

router.get('/user', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../views/User.html'));
});

router.get('/modelinfo', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../views/ModelInfo.html'));
});

router.get('/delivery', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../views/Delivery.html'));
});

router.get('/delivery/history', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../views/DeliveryHistory.html'));
});


module.exports = router;
