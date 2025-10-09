
const express = require('express');
const router = express.Router();
const db = ('./config/dbconfig');


router.get('/users', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const rows = await conn.query('SELECT * FROM users'); // bảng "users"
    res.json(rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
