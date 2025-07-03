const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const config = require('../config');
const sendEmail = require('../utils/sendEmail');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const dbPath = '/data/visitors.db';
const db = new sqlite3.Database(dbPath);

router.post('/', async (req, res) => {
  const {
    name, lastName, email,
    company, country, jobTitle,
    source, origin, expoName
  } = req.body;

  if (!name || !lastName || !email || !company || !country || !expoName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const cleanedJobTitle = jobTitle && jobTitle.trim() !== '' ? jobTitle : 'N/A';
  const badgeID = Date.now().toString();

  const qrDir = path.join(__dirname, '../public/qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);
  const qrPath = path.join(qrDir, `${badgeID}.png`);
  await QRCode.toFile(qrPath, `https://${req.headers.host}/badge.html?badge_id=${badgeID}`);

  const newVisitor = {
    badgeID,
    name,
    lastName,
    email,
    company,
    country,
    jobTitle: cleanedJobTitle,
    source,
    origin,
    expoName,
    timeStamp: new Date().toISOString(),
    checkInTime: ''
  };

  db.run(
    `INSERT OR REPLACE INTO visitors (
      badgeID, name, lastName, email, company, country, jobTitle, source,
      origin, expoName, timeStamp, checkInTime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newVisitor.badgeID,
      newVisitor.name,
      newVisitor.lastName,
      newVisitor.email,
      newVisitor.company,
      newVisitor.country,
      newVisitor.jobTitle,
      newVisitor.source,
      newVisitor.origin,
      newVisitor.expoName,
      newVisitor.timeStamp,
      newVisitor.checkInTime
    ],
    async function (err) {
      if (err) {
        console.error("❌ SQLite insert error:", err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (config.sendEmail) {
        await sendEmail({
          to: email,
          subject: `Votre code QR – ${expoName} / Your QR Code – ${expoName}`,
          name,
          lastName,
          expoName,
          qrPath
        });
      }

      console.log("✅ Visitor saved:", badgeID);
      res.json({ message: 'Visitor registered', badgeID });
    }
  );
});

module.exports = router;
