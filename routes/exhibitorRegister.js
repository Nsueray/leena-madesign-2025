const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const QRCode = require('qrcode');

const dbPath = '/data/visitors.db';
const db = new sqlite3.Database(dbPath);

// Ensure table exists
db.run(`CREATE TABLE IF NOT EXISTS exhibitors (
  badgeID TEXT PRIMARY KEY,
  name TEXT,
  lastName TEXT,
  email TEXT,
  company TEXT,
  expoName TEXT,
  timeStamp TEXT
)`);

router.post('/', async (req, res) => {
  const { name, lastName, email, company, expoName } = req.body;

  if (!name || !lastName || !email || !company || !expoName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const badgeID = Date.now().toString();
  const qrPath = path.join(__dirname, `../public/qrcodes/${badgeID}.png`);
  await QRCode.toFile(qrPath, `https://${req.headers.host}/badge.html?badge_id=${badgeID}`);

  const stmt = db.prepare(`INSERT OR REPLACE INTO exhibitors 
    (badgeID, name, lastName, email, company, expoName, timeStamp) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  stmt.run(
    badgeID,
    name,
    lastName,
    email,
    company,
    expoName,
    new Date().toISOString(),
    function (err) {
      if (err) {
        console.error("❌ SQLite insert error:", err);
        return res.status(500).json({ message: 'Database error' });
      }
      console.log("✅ Exhibitor saved:", badgeID);
      res.json({ message: 'Exhibitor registered', badgeID });
    }
  );
});

module.exports = router;
