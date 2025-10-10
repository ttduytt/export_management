
const express = require('express');
const router = express.Router();
const db = require('../config/dbconfig');

router.get('/users', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM user');
    res.json(rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const rows = await db.query('SELECT * FROM user WHERE user_name = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, message: 'Login successful', username: user.user_name, password: user.password, role: user.role });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
