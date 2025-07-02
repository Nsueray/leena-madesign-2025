const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = '/data/visitors.db';
const db = new sqlite3.Database(dbPath);

router.get('/', (req, res) => {
  const sql = 'SELECT * FROM visitors ORDER BY timeStamp DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❌ Error reading from SQLite:', err);
      return res.status(500).json({ error: 'Could not load visitors' });
    }
    res.json(rows);
  });
});

module.exports = router;
