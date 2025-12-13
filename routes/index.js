import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { authenticate } from "../authentication/middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Login.html"));
});

router.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Home.html"));
});

router.get("/delivery", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Delivery.html"));
});

router.get("/deliveryHistory", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/DeliveryHistory.html"));
});

router.get("/admin", authenticate, (req, res) => {
  if (req.user.factory === "V4") {
    return res.sendFile(path.join(__dirname, "../views/Admin.html"));
  } else {
    return res.redirect("/?msg=no_permission");
  }
});

router.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../views/NotFound.html"));
});

export default router;
