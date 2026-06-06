import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  authenticate,
  checkRememberLogin,
} from "../authentication/middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* GET home page. */
router.get("/", checkRememberLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Login.html"));
});

router.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Home.html"));
});

router.get("/delivery", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Delivery.html"));
});

router.get("/translations", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Translation.html"));
});

router.get("/deliveryHistory", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/DeliveryHistory.html"));
});

router.get("/management", authenticate, (req, res) => {
  if (req.user.role == "ADMIN" || req.user.role == "MANAGER") {
    return res.sendFile(path.join(__dirname, "../views/Management.html"));
  } else {
    return res.redirect("/?msg=no_permission");
  }
});

router.get("/user", authenticate, (req, res) => {
  if (req.user.role == "ADMIN") {
    return res.sendFile(path.join(__dirname, "../views/User.html"));
  } else {
    return res.redirect("/?msg=no_permission");
  }
});

router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../views/NotFound.html"));
});

export default router;
