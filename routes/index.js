import express from "express";
import path from "path";
import { fileURLToPath } from "url";

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

router.get("/delivery", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Delivery.html"));
});

router.get("/deliveryHistory", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/DeliveryHistory.html"));
});

router.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Admin.html"));
});

export default router;
