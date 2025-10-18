import express from "express";
const router = express.Router();
import pool from "../config/dbconfig.js";

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

//add user
router.post("/users", async (req, res) => {
  let conn;
  const { user_name, password, role, factory } = req.body;
  try {
    conn = await pool.getConnection();
    // check duplicate username
    const existing = await conn.query(
      "SELECT * FROM user WHERE user_name = ?",
      [user_name]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }
    let result = await conn.query(
      "INSERT INTO user (user_name, password, role, factory) VALUES (?, ?, ?, ?)",
      [user_name, password, role, factory]
    );
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" + error.message });
  } finally {
    if (conn) conn.release();
  }
});

// edit user
router.put("/users/:id", async (req, res) => {
  let conn;
  const userId = req.params.id;
  const { password, role, factory } = req.body;

  try {
    conn = await pool.getConnection();

    const existing = await conn.query("SELECT * FROM user WHERE id = ?", [
      userId,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await conn.query(
      "UPDATE user SET password = ?, role = ?, factory = ? WHERE id = ?",
      [password, role, factory, userId]
    );

    if (result.affectedRows > 0) {
      res.json({ message: `User ${userId} updated successfully` });
    } else {
      res.status(400).json({ message: "Update failed" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// delete user
router.delete("/users/:id", async (req, res) => {
  let conn;
  const userId = req.params.id;
  try {
    conn = await pool.getConnection();

    const existing = await conn.query("SELECT * FROM user WHERE id = ?", [
      userId,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await conn.query("DELETE FROM user WHERE id = ?", [userId]);

    if (result.affectedRows > 0) {
      res.json({ message: `User ${userId} deleted successfully` });
    } else {
      res.status(400).json({ message: "Delete failed" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
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

//add model spec
router.post("/models", async (req, res) => {
  let conn;
  const { model_type, mobis_code, partron_code, model_name, event_user } =
    req.body;
  try {
    conn = await pool.getConnection();
    // check duplicate mobis_code
    const existing = await conn.query(
      "SELECT * FROM delivery_spec WHERE mobis_code = ?",
      [mobis_code]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Mobis code already exists" });
    }
    let result = await conn.query(
      "INSERT INTO delivery_spec (model_type, mobis_code, partron_code, model_name, event_user) VALUES (?, ?, ?, ?, ?)",
      [model_type, mobis_code, partron_code, model_name, event_user]
    );
    res.status(201).json({ message: "Model spec created successfully" });
  } catch (error) {
    console.error("Error creating model spec:", error);
    res.status(500).json({ message: "Internal server error" + error.message });
  } finally {
    if (conn) conn.release();
  }
});

//edit model spec
router.put("/models/:id", async (req, res) => {
  let conn;
  const modelId = req.params.id;
  const { model_type, mobis_code, partron_code, model_name, event_user } =
    req.body;
  try {
    conn = await pool.getConnection();

    const existing = await conn.query(
      "SELECT * FROM delivery_spec WHERE id = ?",
      [modelId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Model spec not found" });
    }
    // check duplicate mobis_code
    const duplicateCheck = await conn.query(
      "SELECT * FROM delivery_spec WHERE mobis_code = ? AND id != ?",
      [mobis_code, modelId]
    );
    if (duplicateCheck.length > 0) {
      return res.status(400).json({ message: "Mobis code already exists" });
    }
    const result = await conn.query(
      "UPDATE delivery_spec SET model_type = ?, mobis_code = ?, partron_code = ?, model_name = ?, event_user = ? WHERE id = ?",
      [model_type, mobis_code, partron_code, model_name, event_user, modelId]
    );
    if (result.affectedRows > 0) {
      res.json({ message: `Model spec ${modelId} updated successfully` });
    } else {
      res.status(400).json({ message: "Update failed" });
    }
  } catch (error) {
    console.error("Error updating model spec:", error);
    res.status(500).json({ message: "Internal server error" + error.message });
  } finally {
    if (conn) conn.release();
  }
});

// delete model spec
router.delete("/models/:id", async (req, res) => {
  let conn;
  const id = req.params.id;
  try {
    conn = await pool.getConnection();

    const existing = await conn.query(
      "SELECT * FROM delivery_spec WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Model spec not found" });
    }

    const result = await conn.query("DELETE FROM delivery_spec WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows > 0) {
      res.json({ message: `Model spec ${id} deleted successfully` });
    } else {
      res.status(400).json({ message: "Delete failed" });
    }
  } catch (error) {
    console.error("Error deleting model spec:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// Bulk import model specs
router.post("/models/importmodelspec", async (req, res) => {
  let conn;
  const models = req.body.specs;
  if (!Array.isArray(models) || models.length === 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const insertSQL = `
      INSERT INTO delivery_spec (model_type, mobis_code, partron_code, model_name, event_user)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        model_type = VALUES(model_type),
        partron_code = VALUES(partron_code),
        model_name = VALUES(model_name),
        event_user = VALUES(event_user)
    `;

    const insertPromises = models.map((model) => {
      const { model_type, mobis_code, partron_code, model_name, event_user } =
        model;
      return conn.query(insertSQL, [
        model_type,
        mobis_code,
        partron_code,
        model_name,
        event_user,
      ]);
    });

    await Promise.all(insertPromises);
    await conn.commit();
    res.status(201).json({
      message: "Model specs imported successfully (inserted/updated)",
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error importing model specs:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// history delivery
router.get("/delivery/history/:factory", async (req, res) => {
  let conn;
  const factory = req.params.factory;
  const page = parseInt(req.query.page) || 1;
  const limit = 500;
  const offset = (page - 1) * limit;
  // Các tham số lọc
  const search = req.query.search ? req.query.search.trim() : "";
  const dateFrom = req.query.dateFrom ? req.query.dateFrom.trim() : "";
  const dateTo = req.query.dateTo ? req.query.dateTo.trim() : "";

  try {
    conn = await pool.getConnection();
    let sql = `SELECT * FROM delivery_history_${factory} WHERE 1=1`;
    const params = [];
    // Bộ lọc text (mobis_code, model_name)
    if (search) {
      sql += ` AND (
        mobis_code LIKE ? OR
        model_name LIKE ?
      )`;
      const likeStr = `%${search}%`;
      params.push(likeStr, likeStr);
    }

    // Bộ lọc ngày
    if (dateFrom) {
      sql += ` AND event_time >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND event_time <= ?`;
      params.push(dateTo);
    }

    // Phân trang + sắp xếp
    sql += ` ORDER BY event_time DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const rows = await conn.query(sql, params);
    // Kiểm tra có trang tiếp theo không
    const nextRows = await conn.query(
      `SELECT 1 FROM delivery_history_${factory} WHERE 1=1
       ${search ? ` AND (mobis_code LIKE ? OR model_name LIKE ?)` : ""}
       ${dateFrom ? ` AND event_time >= ?` : ""}
       ${dateTo ? ` AND event_time <= ?` : ""}
       LIMIT 1 OFFSET ?`,
      search
        ? [
            ...Array(2).fill(`%${search}%`),
            ...(dateFrom ? [dateFrom] : []),
            ...(dateTo ? [dateTo] : []),
            offset + limit,
          ]
        : [
            ...(dateFrom ? [dateFrom] : []),
            ...(dateTo ? [dateTo] : []),
            offset + limit,
          ]
    );

    const result = JSON.parse(
      JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );
    res.json({
      page,
      limit,
      data: result,
      hasNextPage: nextRows.length > 0,
    });
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    if (factory === "v0") {
      sqlquery = "SELECT * FROM delivery_v0 ORDER BY create_at DESC LIMIT 100";
    } else {
      sqlquery = "SELECT * FROM delivery_v5 ORDER BY create_at DESC LIMIT 100";
    }
    const rows = await conn.query(sqlquery);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching delivery:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/delivery", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const sqlquery =
      "SELECT * FROM delivery_v0 union all select * from delivery_v5";
    const rows = await conn.query(sqlquery);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching delivery:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/delivery/:modelId/:factory", async (req, res) => {
  let conn;
  const modelId = req.params.modelId;
  const factory = req.params.factory;
  try {
    conn = await pool.getConnection();
    const sqlquery = `SELECT * FROM ${
      factory === "v0" ? "delivery_v0" : "delivery_v5"
    } WHERE model_id = ?`;
    const rows = await conn.query(sqlquery, [modelId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching delivery:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/qr/:factory/:mobiscode/:type", async (req, res) => {
  const conn = await pool.getConnection();
  const { factory, mobiscode, type } = req.params;

  try {
    const tableName = factory === "v0" ? "delivery_v0" : "delivery_v5";

    const delivery = await conn.query(
      `SELECT * FROM ${tableName} WHERE mobis_code = ? AND type = ? AND status != 'Complete'
      ORDER BY ABS(TIMESTAMPDIFF(SECOND, shipment_date, CURDATE())) ASC,CASE WHEN shipping_method = 'SEA' THEN 0 ELSE 1 END LIMIT 1;`,
      [mobiscode, type]
    );

    if (delivery.length > 0) {
      res.json(delivery[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn:", error);
    res.status(500).json({ message: "Có lỗi khi tìm kiếm dữ liệu" });
  } finally {
    conn.release();
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
    console.error("Error deleting delivery:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
          delivery.target,
          delivery.shipmentdate,
          delivery.shippingmethod,
          delivery.type,
        ]
      );

      if (Number(isDeliveryExist[0].count) != 0) {
        res.status(400).json({
          message: `Thông tin xuất hàng tại dòng ${index + 2} đã tồn tại`,
        });
        return;
      }

      let rows = await conn.query(
        `
        SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(model_id, '-', -1) AS UNSIGNED)), 0) AS countModel
        FROM delivery_${factory}
        WHERE mobis_code = ?`,
        [delivery.mobiscode]
      );
      const countModel = Number(rows[0].countModel) + 1;
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0].replace(/-/g, "");
      delivery[
        "modelid"
      ] = `${delivery.mobiscode}-${formattedDate}-${countModel}`;
      // Thêm vào bảng delivery
      const deliverySql = `
        INSERT INTO ${factory === "v0" ? "delivery_v0" : "delivery_v5"}
        (model_id, mobis_code, model_name, type, target, status,
         quantity, shipping_method, shipment_date)
        VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await conn.query(deliverySql, [
        delivery.modelid,
        delivery.mobiscode,
        delivery.modelname,
        delivery.type,
        delivery.target,
        "Wait",
        delivery.quantity,
        delivery.shippingmethod,
        delivery.shipmentdate,
      ]);

      await addHistoryDelivery(conn, delivery, username, factory);
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

router.put("/delivery/update/quantity", async (req, res) => {
  const { username, factory, delivery, qr } = req.body;
  const tableName = factory === "v0" ? "delivery_v0" : "delivery_v5";
  let conn;
  conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const queryUpdateRestStatus = `UPDATE ${tableName} SET status = 'Wait' WHERE status = 'Run' `;
    await conn.query(queryUpdateRestStatus);

    const query = `UPDATE ${tableName} SET status = ?, quantity = ?, complete_time = ? WHERE model_id = ?`;
    await conn.query(query, [
      delivery.status,
      delivery.quantity,
      delivery.complete_time,
      delivery.model_id,
    ]);

    for (const key in delivery) {
      const newKey = key.replaceAll("_", "");
      let value = delivery[key];

      if (newKey !== key) {
        delivery[newKey] = value;
        delete delivery[key];
      } else {
        delivery[key] = value;
      }
    }

    await addHistoryDelivery(conn, delivery, username, factory, qr);
    res.json({ status: 200, message: "Cập nhật số lượng hàng thành công" });
    await conn.commit();
  } catch (error) {
    console.error(error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: "Cập nhật thất bại" });
  }
});

router.get("/qr/getvalue", async (req, res) => {
  const conn = await pool.getConnection();
  const factory = req.query.factory;
  const qrvalue = req.query.qrvalue;
  const tableName =
    factory === "v0" ? "delivery_history_v0" : "delivery_history_v5";

  try {
    let data = await conn.query(`SELECT * FROM ${tableName} WHERE qr = ?`, [
      qrvalue,
    ]);

    data = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    if (data.length > 0) {
      res.json(data[0]);
    } else {
      res.json(false);
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn QR:", error);
    res.status(500).json({ message: error });
  } finally {
    conn.release();
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
        factory: user.factory,
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
  const factory = req.query.factory;
  try {
    if (factory == "V0") {
      const totalExportRowsV0 = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM delivery_v0
      WHERE DATE(create_at) = CURDATE()
    `);
      const performanceRowsV0 = await pool.query(`
      SELECT COUNT(*) AS completed 
      FROM delivery_v0
      WHERE status = 'COMPLETE' 
        AND DATE(create_at) = CURDATE()
    `);
      const totalExport = Number(totalExportRowsV0[0].total);
      const performanceInDay =
        ((Number(performanceRowsV0[0].completed) || 0) / (totalExport || 1)) *
        100;
      res.json({
        totalExport,
        performanceInDay,
      });
    } else if (factory == "V5") {
      const totalExportRowsV5 = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM delivery_v5
      WHERE DATE(create_at) = CURDATE()
    `);
      const performanceRowsV5 = await pool.query(`
      SELECT COUNT(*) AS completed 
      FROM delivery_v5
      WHERE status = 'COMPLETE' 
        AND DATE(create_at) = CURDATE()
    `);
      const totalExport = Number(totalExportRowsV5[0].total);
      const performanceInDay =
        (Number(performanceRowsV5[0].completed) / (totalExport || 1)) * 100;
      res.json({
        totalExport,
        performanceInDay,
      });
    } else {
      const totalExportRowsV0 = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM delivery_v0
      WHERE DATE(create_at) = CURDATE()
    `);
      const performanceRowsV0 = await pool.query(`
      SELECT COUNT(*) AS completed 
      FROM delivery_v0
      WHERE status = 'COMPLETE' 
        AND DATE(create_at) = CURDATE()
    `);
      const totalExportRowsV5 = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM delivery_v5
      WHERE DATE(create_at) = CURDATE()
    `);
      const performanceRowsV5 = await pool.query(`
      SELECT COUNT(*) AS completed 
      FROM delivery_v5
      WHERE status = 'COMPLETE' 
        AND DATE(create_at) = CURDATE()
    `);
      const totalExport =
        Number(totalExportRowsV0[0].total) + Number(totalExportRowsV5[0].total);
      const performanceInDay =
        ((Number(performanceRowsV0[0].completed) +
          Number(performanceRowsV5[0].completed) || 0) /
          (totalExport || 1)) *
        100;
      res.json({
        totalExport,
        performanceInDay,
      });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

router.get("/api/getmonthlyperformance", async (req, res) => {
  try {
    const factory = req.query.factory || "V0";
    if (factory == "V0") {
      const rows = await pool.query(`
      SELECT 
          month,
          COUNT(*) AS total
      FROM (
          SELECT DATE_FORMAT(create_at, '%Y-%m') AS month
          FROM delivery_v0
          WHERE create_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      ) AS combined
      GROUP BY month
      ORDER BY month;
      
    `);
      const months = rows.map((r) => r.month);
      const totals = rows.map((r) => Number(r.total));

      res.json({ months, totals });
    } else if (factory == "V5") {
      const rows = await pool.query(`
      SELECT
          month,
          COUNT(*) AS total
      FROM (
          SELECT DATE_FORMAT(create_at, '%Y-%m') AS month
          FROM delivery_v5
          WHERE create_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      ) AS combined
      GROUP BY month
      ORDER BY month;      
    `);
      const months = rows.map((r) => r.month);
      const totals = rows.map((r) => Number(r.total));

      res.json({ months, totals });
    } else {
      const rows = await pool.query(`
      SELECT 
          month,
          COUNT(*) AS total
      FROM (
          SELECT DATE_FORMAT(create_at, '%Y-%m') AS month
          FROM delivery_v0
          WHERE create_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)

          UNION ALL

          SELECT DATE_FORMAT(create_at, '%Y-%m') AS month
          FROM delivery_v5
          WHERE create_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      ) AS combined
      GROUP BY month
      ORDER BY month;
    `);
      const months = rows.map((r) => r.month);
      const totals = rows.map((r) => Number(r.total));

      res.json({ months, totals });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

router.get("/api/getstatuscount", async (req, res) => {
  try {
    const factory = req.query.factory || "V0";
    if (factory == "V0") {
      const rows = await pool.query(`
        SELECT 
            status,
            COUNT(*) AS count
        FROM (
            SELECT status FROM delivery_v0
        ) AS combined
        GROUP BY status
        ORDER BY status;
      `);

      const statusCounts = {};
      rows.forEach((r) => {
        statusCounts[r.status] = Number(r.count);
      });

      // Tính tổng complete và tổng run + wait
      const completed = statusCounts["Complete"] || 0;
      const inProgress =
        (statusCounts["Run"] || 0) + (statusCounts["Wait"] || 0);

      res.json({
        completed: completed,
        inProgress: inProgress,
      });
    } else if (factory == "V5") {
      const rows = await pool.query(`
          SELECT 
              status,
              COUNT(*) AS count
          FROM (
              SELECT status FROM delivery_v5
          ) AS combined
          GROUP BY status
          ORDER BY status;
        `);

      const statusCounts = {};
      rows.forEach((r) => {
        statusCounts[r.status] = Number(r.count);
      });

      // Tính tổng complete và tổng run + wait
      const completed = statusCounts["Complete"] || 0;
      const inProgress =
        (statusCounts["Run"] || 0) + (statusCounts["Wait"] || 0);

      res.json({
        completed: completed,
        inProgress: inProgress,
      });
    } else {
      const rows = await pool.query(`
          SELECT 
              status,
              COUNT(*) AS count
          FROM (
              SELECT status FROM delivery_v0
              UNION ALL
              SELECT status FROM delivery_v5
          ) AS combined
          GROUP BY status
          ORDER BY status;
        `);
      const statusCounts = {};
      rows.forEach((r) => {
        statusCounts[r.status] = Number(r.count);
      });

      // Tính tổng complete và tổng run + wait
      const completed = statusCounts["Complete"] || 0;
      const inProgress =
        (statusCounts["Run"] || 0) + (statusCounts["Wait"] || 0);

      res.json({
        completed: completed,
        inProgress: inProgress,
      });
    }
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

async function addHistoryDelivery(
  conn,
  delivery,
  username,
  factory,
  qr = null
) {
  //  Thêm vào bảng history
  const historySql = `
        INSERT INTO ${
          factory === "v0" ? "delivery_history_v0" : "delivery_history_v5"
        }
        (model_id, qr, mobis_code, model_name, type, target, event_quantity,
         shipment_date, shipping_method, event_user)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

  await conn.query(historySql, [
    delivery.modelid,
    qr,
    delivery.mobiscode,
    delivery.modelname,
    delivery.type,
    delivery.target,
    delivery.quantity,
    delivery.shipmentdate,
    delivery.shippingmethod,
    username,
  ]);
}

export default router;
