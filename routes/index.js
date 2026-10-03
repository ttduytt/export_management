import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  authenticate,
  checkRememberLogin,
  checkMenuAccess,
} from "../authentication/middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* GET home page. */
router.get("/", checkRememberLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Login.html"));
});

router.get("/delivery", authenticate, checkMenuAccess("delivery"), (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Delivery.html"));
});

router.get("/scanpallet", authenticate, checkMenuAccess("scanpallet"), (req, res) => {
  res.sendFile(path.join(__dirname, "../views/ScanPallet.html"));
});


router.get("/translations", authenticate, checkMenuAccess("translations"), (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Translation.html"));
});

router.get("/deliveryHistory", authenticate, checkMenuAccess("history"), (req, res) => {
  res.sendFile(path.join(__dirname, "../views/DeliveryHistory.html"));
});

router.get("/management", authenticate, checkMenuAccess("management"), (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Management.html"));
});

router.get("/user", authenticate, checkMenuAccess("user"), (req, res) => {
  res.sendFile(path.join(__dirname, "../views/User.html"));
});

// Admin-only hardcoded route as requested by user ("tạo menu mới, và chỉ user có quyền ADMIN mới nhìn thấy menu này, fix cứng vậy luôn")
router.get("/roles", authenticate, (req, res) => {
  if (req.user.role === "ADMIN") {
    res.sendFile(path.join(__dirname, "../views/RoleManagement.html"));
  } else {
    res.redirect("/?msg=no_permission");
  }
});

router.get("/role-menus", authenticate, (req, res) => {
  if (req.user.role === "ADMIN") {
    res.sendFile(path.join(__dirname, "../views/MenuConfig.html"));
  } else {
    res.redirect("/?msg=no_permission");
  }
});

router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../views/NotFound.html"));
});

export default router;
