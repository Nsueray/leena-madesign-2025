const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const dbPath = '/data/visitors.db';
const db = new sqlite3.Database(dbPath);

router.get('/', (req, res) => {
  const { date, expoName } = req.query;

  if (!date || !expoName) {
    return res.status(400).json({ message: 'Missing date or expoName' });
  }

  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;

  const sql = `
    SELECT * FROM visitors 
    WHERE expoName = ?
  `;

  db.all(sql, [expoName], (err, rows) => {
    if (err) {
      console.error("❌ SQLite error:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    const totalVisitors = rows.length;

    const pendingVisitors = rows.filter(v => {
      return !v.checkInTime || v.checkInTime < start || v.checkInTime > end;
    });

    const uniqueEmails = new Set(pendingVisitors.map(v => v.email)).size;

    res.json({
      totalVisitors,
      pendingVisitors: pendingVisitors.length,
      uniqueEmails
    });
  });
});

module.exports = router;
