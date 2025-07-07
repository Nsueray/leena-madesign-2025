const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, '../data/visitors.db');
const db = new sqlite3.Database(dbPath);

// GET /api/checkins-sqlite
router.get('/', (req, res) => {
  const query = `SELECT badgeID, name, lastName, company, email, country, expoName, source, origin, checkInTime
                 FROM checkins ORDER BY checkInTime DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ SQLite error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;
