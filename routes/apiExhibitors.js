const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();
const dbPath = path.join(__dirname, '../data/exhibitors.db');

const db = new sqlite3.Database(dbPath);

// GET /api/exhibitors
router.get('/', (req, res) => {
  db.all("SELECT * FROM exhibitors", [], (err, rows) => {
    if (err) {
      console.error('SQLite error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;
