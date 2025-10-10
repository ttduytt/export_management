const express = require("express");
const router = express.Router();
const pool = require("../config/dbconfig");

// user
router.get("/users", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM user");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// model spec
router.get("/models", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM delivery_spec");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching delivery_spec:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// delivery
router.get("/delivery/:facory", async (req, res) => {
  let conn;
  const factory = req.params.facory;
  let sqlquery;

  try {
    conn = await pool.getConnection();
    factory === "v0"
      ? (sqlquery = "SELECT * FROM delivery_v0")
      : (sqlquery = "SELECT * FROM delivery_v5");
    const rows = await conn.query(sqlquery);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching delivery:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

router.delete("/delivery", async (req, res) => {
  let conn;
  const model_id = req.query.modelid;
  const factory = req.query.factory;
  try {
    conn = await pool.getConnection();

    const existing = await conn.query(
      `SELECT * FROM delivery_${factory} WHERE model_id = ?`,
      [model_id]
    );
    if (existing.length === 0) {
      return res.json({ message: "Delivery not found" });
    }

    const result = await conn.query(
      `DELETE FROM delivery_${factory} WHERE model_id = ?`,
      [model_id]
    );

    if (result.affectedRows > 0) {
      res.json({ message: `Delivery deleted successfully` });
    } else {
      res.status(400).json({ message: "Delete failed" });
    }
  } catch (error) {
    console.error("Error deleting delivery:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

router.post("/delivery", async (req, res) => {
  const factory = req.query.factory;
  const data = req.body;
  let conn;

  try {
    conn = await pool.getConnection();

    const table = factory === "v0" ? "delivery_v0" : "delivery_v5";

    const sql = `
      INSERT INTO ${table}
      (model_id, mobis_code, model_name, type, target, quantity, status, complete_time, create_at, shipment_date, shipping_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.model_id,
      data.mobis_code,
      data.model_name,
      data.type,
      data.target,
      data.quantity,
      data.status,
      data.complete_time,
      data.create_at,
      data.shipment_date,
      data.shipping_method,
    ];

    const result = await conn.query(sql, params);

    res.status(201).json({
      message: "Delivery added successfully",
      insertId: result.insertId,
    });
  } catch (err) {
    console.error("Error adding delivery:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// history delivery
router.get("/delivery/history/:fatory", async (req, res) => {
  let conn;
  const factory = req.params.fatory;

  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM delivery_history_${factory}`);
    const result = JSON.parse(
      JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching delivery:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

router.post("/delivery/history/:factory", async (req, res) => {
  const factory = req.params.fatory;
  const data = req.body;
  let conn;

  try {
    conn = await pool.getConnection();

    const sql = `
      INSERT INTO ${
        factory === "v0" ? "delivery_history_v0" : "delivery_history_v5"
      }
      (model_id, qr, mobis_code, model_name, type, target, event_quantity,
       shipment_date, shipping_method, event_user, event_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.model_id,
      data.qr,
      data.mobis_code,
      data.model_name,
      data.type,
      data.target,
      data.event_quantity,
      data.shipment_date,
      data.shipping_method,
      data.event_user,
      data.event_time,
    ];

    const result = await conn.query(sql, params);

    res.status(201).json({
      message: "History record added successfully",
      insertId: result.insertId.toString(),
    });
  } catch (err) {
    console.error("Error adding delivery history:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
