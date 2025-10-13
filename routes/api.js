const express = require("express");
const router = express.Router();
const pool = require("../config/dbconfig");
const dayjs = require("dayjs");

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
    const rows = await conn.query(
      "SELECT * FROM delivery_spec ORDER BY MOBIS_CODE"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching delivery_spec:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// delivery
router.get("/delivery/:factory", async (req, res) => {
  let conn;
  const factory = req.params.factory;
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

router.post("/delivery/import", async (req, res) => {
  const { username, factory, deliveries } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction(); // khởi tạo transaction

    for (const [index, delivery] of deliveries.entries()) {
      const isSpecExist = await conn.query(
        `SELECT COUNT(*) AS count
   FROM delivery_spec
   WHERE mobis_code = ?
     AND model_type = ?
     AND partron_code = ?
     AND model_name = ?`,
        [
          delivery.mobiscode,
          delivery.modeltype,
          delivery.partroncode,
          delivery.modelname,
        ]
      );

      if (Number(isSpecExist[0].count) === 0) {
        res.status(400).json({
          message: `Dữ liệu tiêu chuẩn tại dòng ${index + 2} không tồn tại`,
        });
        return;
      }

      const isDeliveryExist = await conn.query(
        `SELECT COUNT(*) AS count
   FROM delivery_${factory}
   WHERE mobis_code = ?
     AND target = ?
     AND shipment_date = ?
     AND shipping_method = ?
     AND type = ?`,
        [
          delivery.mobiscode,
          delivery.targetquantity,
          delivery.shipmentdate,
          delivery.shippingmethod,
          delivery.type,
        ]
      );

      if (isDeliveryExist[0].count != 0) {
        res.status(400).json({
          message: `Thông tin xuất hàng tại dòng ${index + 2} đã tồn tại`,
        });
        return;
      }

      let modelid = await conn.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(model_id, '-', -1) AS UNSIGNED)), 0)
                          FROM delivery_${factory}
                          WHERE mobis_code = ?`,
        [delivery.mobiscode]
      );

      // Thêm vào bảng delivery
      const deliverySql = `
        INSERT INTO ${factory === "v0" ? "delivery_v0" : "delivery_v5"}
        (model_id, mobis_code, model_name, type, target, status,
         quantity, shipping_method, shipment_date)
        VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await conn.query(deliverySql, [
        modelid[0] + 1,
        delivery.mobiscode,
        delivery.modelname,
        delivery.type,
        delivery.targetquantity,
        "Wait",
        delivery.quantity,
        delivery.shippingmethod,
        toMySQLDate(delivery.shipmentdate),
      ]);

      //  Thêm vào bảng history
      const historySql = `
        INSERT INTO ${
          factory === "v0" ? "delivery_history_v0" : "delivery_history_v5"
        }
        (model_id, qr, mobis_code, model_name, type, target, event_quantity,
         shipment_date, shipping_method, event_user, event_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await conn.query(historySql, [
        modelid[0] + 1,
        delivery.qr,
        delivery.mobiscode,
        delivery.modelname,
        delivery.type,
        delivery.target,
        delivery.quantity,
        delivery.shipmentdate,
        delivery.shippingmethod,
        username,
        new Date(),
      ]);
    }

    await conn.commit(); // ✅ commit
    res.status(201).json({ message: "Import delivery thành công!" });
  } catch (error) {
    if (conn) await conn.rollback(); // rollback nếu bất kỳ dòng nào lỗi
    console.error("Error inserting deliveries:", error);
    res.status(500).json({ message: "Thêm thất bại, đã rollback toàn bộ" });
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

// login
router.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const rows = await pool.query(
      "SELECT * FROM user WHERE user_name = ? AND password = ?",
      [username, password]
    );
    if (rows.length > 0) {
      const user = rows[0];
      res.json({
        success: true,
        message: "Login successful",
        username: user.user_name,
        password: user.password,
        role: user.role,
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/api/getoverview", async (req, res) => {
  try {
    const totalExportRows = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM delivery 
      WHERE DATE(create_at) = CURDATE()
    `);

    const performanceRows = await pool.query(`
      SELECT COUNT(*) AS completed 
      FROM delivery 
      WHERE status = 'COMPLETE' 
        AND DATE(create_at) = CURDATE()
    `);

    const totalExport = Number(totalExportRows[0].total);
    const performanceInDay =
      (Number(performanceRows[0].completed) / (totalExport || 1)) * 100;

    res.json({
      totalExport,
      performanceInDay,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

router.get("/api/getmonthlyperformance", async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT 
          DATE_FORMAT(create_at, '%Y-%m') AS month,
          COUNT(*) AS total
      FROM delivery
      WHERE create_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(create_at, '%Y-%m')
      ORDER BY month;
    `);

    const months = rows.map((r) => r.month);
    const totals = rows.map((r) => Number(r.total));

    res.json({ months, totals });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

router.get("/api/getstatuscount", async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT 
          status,
          COUNT(*) AS count
      FROM delivery
      GROUP BY status;
    `);

    const statusCounts = {};
    rows.forEach((r) => {
      statusCounts[r.status] = Number(r.count);
    });

    // Tính tổng complete và tổng run + wait
    const completed = statusCounts["Complete"] || 0;
    const inProgress = (statusCounts["Run"] || 0) + (statusCounts["Wait"] || 0);

    res.json({
      completed: completed,
      inProgress: inProgress,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

function toMySQLDate(input) {
  // input dạng "DD/MM/YYYY"
  const [day, month, year] = input.split("/").map(Number);

  // Tạo Date object local
  const date = new Date(year, month - 1, day);

  const pad = (n) => String(n).padStart(2, "0");

  // Format chuẩn MySQL DATETIME
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`
  );
}

module.exports = router;
