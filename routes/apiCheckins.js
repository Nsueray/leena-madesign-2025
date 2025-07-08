const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, '../data/checkins.db');
const db = new sqlite3.Database(dbPath);

// ✅ Eğer checkins tablosu yoksa oluştur
db.run(`CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badgeID TEXT,
  name TEXT,
  lastName TEXT,
  company TEXT,
  email TEXT,
  country TEXT,
  expoName TEXT,
  source TEXT,
  origin TEXT,
  checkInTime TEXT
)`);

// ✅ POST /api/checkins → yeni check-in ekler
router.post('/', (req, res) => {
  const {
    badgeID,
    name,
    lastName,
    company,
    email,
    country,
    expoName,
    source,
    origin
  } = req.body;

  if (!badgeID || !name || !lastName || !company || !expoName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const checkInTime = new Date().toISOString();

  db.run(
    `INSERT INTO checkins (
      badgeID, name, lastName, company, email, country, expoName, source, origin, checkInTime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      badgeID,
      name,
      lastName,
      company,
      email || '',
      country || '',
      expoName,
      source || 'Unknown',
      origin || 'Unknown',
      checkInTime
    ],
    (err) => {
      if (err) {
        console.error('❌ Check-in insert error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
