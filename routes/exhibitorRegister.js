const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();
const dbPath = path.join(__dirname, '../data/exhibitors.db');

// Veritabanına bağlan
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Failed to connect to exhibitors.db:', err);
});

// Gerekirse tabloyu oluştur
db.run(`CREATE TABLE IF NOT EXISTS exhibitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badgeID TEXT,
  name TEXT,
  lastName TEXT,
  company TEXT,
  jobTitle TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  expoName TEXT,
  timeStamp TEXT
)`);

// POST endpoint
router.post('/', (req, res) => {
  const { name, lastName, company, jobTitle, email, phone, country, expoName } = req.body;
  if (!name || !lastName || !company || !expoName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const timeStamp = new Date().toISOString();
  const badgeID = `exh${Date.now()}${Math.floor(Math.random() * 1000)}`;

  db.run(
    `INSERT INTO exhibitors (badgeID, name, lastName, company, jobTitle, email, phone, country, expoName, timeStamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [badgeID, name, lastName, company, jobTitle, email, phone, country, expoName, timeStamp],
    function (err) {
      if (err) {
        console.error('DB Insert Error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ badgeID });
    }
  );
});

module.exports = router;
