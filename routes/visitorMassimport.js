const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');
const sqlite3 = require('sqlite3').verbose();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const db = new sqlite3.Database('/data/visitors.db');

router.post('/', upload.single('excelFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const skipExistingEmails = req.body.skipExisting === 'true';

    let sentCount = 0;

    for (const row of data) {
      const name = row.name || '';
      const lastName = row.lastName || '';
      const email = row.email || '';
      const company = row.company || '';
      const country = row.country || 'Morocco';
      const jobTitle = row.jobTitle || 'N/A';
      const expoName = row.expoName || 'MadesignMorocco2025';
      const badgeID = row.badgeID || `import${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const origin = 'massimport';
      const source = row.source || 'Mass Import';
      const timeStamp = new Date().toISOString();
      const checkInTime = '';

      if (!email || !name || !lastName || !company) continue;

      const qrDir = path.join(__dirname, '../public/qrcodes');
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);
      const qrPath = path.join(qrDir, `${badgeID}.png`);
      const qrUrl = `https://madesign.leena.app/badge.html?badge_id=${badgeID}`;
      await QRCode.toFile(qrPath, qrUrl);

      const existing = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM visitors WHERE email = ? AND expoName = ?", [email, expoName], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });

      if (existing && skipExistingEmails) continue;

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO visitors (
            badgeID, name, lastName, email, company, country, jobTitle,
            source, origin, expoName, timeStamp, checkInTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            badgeID, name, lastName, email, company, country, jobTitle,
            source, origin, expoName, timeStamp, checkInTime
          ],
          (err) => err ? reject(err) : resolve()
        );
      });

      await sleep(1800);
      await sendEmail({
        to: email,
        name,
        lastName,
        expoName,
        qrPath
      });

      sentCount++;
    }

    fs.unlinkSync(filePath);
    res.json({ imported: sentCount, emailsSent: sentCount });
  } catch (err) {
    console.error('❌ Mass import error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
