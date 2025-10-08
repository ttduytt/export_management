var express = require('express');
var router = express.Router();
var path = require('path'); 

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/Layout/Home.html'));
});

router.get('/admin/user', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/Layout/User.html'));
});

router.get('/admin/model_info', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/Layout/User.html'));
});

module.exports = router;
