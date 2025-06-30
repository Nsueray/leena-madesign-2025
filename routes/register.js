const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const sendEmail = require('../utils/sendEmail');
const { validateVisitor } = require('../utils/schema'); // ✅ Şema doğrulama eklendi

const router = express.Router();
const visitorsFile = path.join(__dirname, '../data/visitors.json');
const qrDir = path.join(__dirname, '../public/qrcodes');

if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

function readVisitors() {
  if (!fs.existsSync(visitorsFile)) return [];
  return JSON.parse(fs.readFileSync(visitorsFile));
}

function safeWriteVisitors(newEntry) {
  let visitors = [];
  try {
    if (fs.existsSync(visitorsFile)) {
      const fileData = fs.readFileSync(visitorsFile, 'utf8');
      visitors = JSON.parse(fileData);
    }
  } catch (err) {
    console.error("❌ Error reading visitors file:", err);
  }

  visitors.push(newEntry);

  try {
    fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2));
    console.log("✅ Visitor saved:", newEntry.badgeID || newEntry.fullName);
  } catch (err) {
    console.error("❌ Error writing visitors file:", err);
  }
}

router.post('/', async (req, res) => {
  const { name, lastName, email, company, origin, source, country, jobTitle, expoName } = req.body;

  // Gerekli alanların varlığı kontrolü
  if (!name || !lastName || !email || !company || !country || !jobTitle || !expoName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const badgeID = Date.now().toString();
  const fullName = `${name} ${lastName}`;
  const qrUrl = `/badge.html?badge_id=${badgeID}`;
  const qrPath = path.join(qrDir, `${badgeID}.png`);

  await QRCode.toFile(qrPath, `https://yourdomain.com${qrUrl}`);

  const timeStamp = new Date().toISOString();
  const checkInTime = null;

  const newVisitor = {
    name,
    lastName,
    email,
    badgeID,
    company,
    country,
    jobTitle,
    source,
    origin,
    expoName,
    timeStamp,
    checkInTime
  };

  // ✅ Şemaya uygunluk kontrolü
  const validation = validateVisitor(newVisitor);
  if (validation !== true) {
    return res.status(400).json({ error: `Invalid visitor data: ${validation}` });
  }

  const visitors = readVisitors();
  visitors.push(newVisitor);
  safeWriteVisitors(newVisitor);

  if (config.sendEmail) {
    await sendEmail({
      to: email,
      fullName,
      attachments: [{ filename: 'qrcode.png', path: qrPath }]
    });
  }

  res.json({ message: 'Visitor registered', badgeID });
});

module.exports = router;
