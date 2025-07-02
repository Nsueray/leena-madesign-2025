const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const config = require('../config');
const sendEmail = require('../utils/sendEmail');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const dbPath = '/data/visitors.db';
const qrDir = path.join(__dirname, '../public/qrcodes');

if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

// SQLite veritabanını başlat
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      badgeID TEXT PRIMARY KEY,
      name TEXT,
      lastName TEXT,
      email TEXT,
      company TEXT,
      phone TEXT,
      jobTitle TEXT,
      sector TEXT,
      country TEXT,
      website TEXT,
      visitorCategory TEXT,
      visitorStatus TEXT,
      visitorType TEXT,
      source TEXT,
      origin TEXT,
      expoName TEXT,
      timeStamp TEXT,
      checkInTime TEXT
    )
  `);
});

router.post('/', async (req, res) => {
  console.log("📨 Incoming webhook data:", req.body);
  try {
    const body = req.body;

    const name = body.name || '';
    const lastName = body.lastName || '';
    const badgeID = body.badgeID || Date.now().toString();
    const email = body.email || '';
    const company = body.company || '';
    const origin = 'zohoform';
    const source = body.source || '';
    const expoName = body.expoName || 'Madesign';

    if (!name || !lastName || !email || !company) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const qrUrl = `/badge.html?badge_id=${badgeID}`;
    const qrPath = path.join(qrDir, `${badgeID}.png`);
    await QRCode.toFile(qrPath, `https://madesign.leena.app${qrUrl}`);

    const newVisitor = {
      badgeID,
      name,
      lastName,
      email,
      company,
      phone: body.phone || '',
      jobTitle: body.jobTitle || 'N/A',
      sector: body.sector || '',
      country: body.country || '',
      website: body.website || '',
      visitorCategory: body.visitorCategory || '',
      visitorStatus: body.visitorStatus || '',
      visitorType: body.visitorType || '',
      source,
      origin,
      expoName,
      timeStamp: new Date().toISOString(),
      checkInTime: ''
    };

    db.run(
      `INSERT OR REPLACE INTO visitors (
        badgeID, name, lastName, email, company, phone, jobTitle, sector, country, website,
        visitorCategory, visitorStatus, visitorType, source, origin, expoName, timeStamp, checkInTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(newVisitor),
      function (err) {
        if (err) {
          console.error("❌ Error writing to SQLite:", err);
          return res.status(500).json({ message: 'Database write failed' });
        }
        console.log("✅ Visitor saved:", badgeID);
        if (config.sendEmail) {
          sendEmail({
            to: email,
            name,
            lastName,
            expoName,
            qrPath
          }).then(() => {
            console.log("✅ Email sent to", email);
          }).catch((e) => {
            console.error("❌ Email error:", e);
          });
        }

        res.status(200).json({ message: 'Webhook received and processed', badgeID });
      }
    );
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
