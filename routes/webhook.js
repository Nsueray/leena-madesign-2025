const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const config = require('../config');
const sendEmail = require('../utils/sendEmail');

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
    console.log("✅ Visitor saved:", newEntry.badgeID);
  } catch (err) {
    console.error("❌ Error writing visitors file:", err);
  }
}

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    const name = body.firstName || '';
    const lastName = body.lastName || '';
    const badgeID = body.badgeNumber || Date.now().toString();
    const email = body.email || '';
    const company = body.companyName || '';
    const origin = 'zohoform';
    const source = body.visitorSource || '';
    const expoName = body.expoName || 'Madesign';

    if (!name || !lastName || !email || !company) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // QR kodu üret
    const qrUrl = `/badge.html?badge_id=${badgeID}`;
    const qrPath = path.join(qrDir, `${badgeID}.png`);
    await QRCode.toFile(qrPath, `https://madesign.leena.app${qrUrl}`);

    // Yeni kayıt
    const newVisitor = {
      name,
      lastName,
      email,
      company,
      origin,
      source,
      badgeID,
      phone: body.phone || '',
      jobTitle: body.jobTitle || 'N/A',
      sector: body.sector || '',
      country: body.country || '',
      website: body.website || '',
      visitorCategory: body.visitorCategory || '',
      visitorStatus: body.visitorStatus || '',
      visitorType: body.visitorType || '',
      expoName,
      timeStamp: new Date().toISOString(),
      checkInTime: ''
    };

    // Kayıt işlemi
    safeWriteVisitors(newVisitor);

    // E-posta gönder
    if (config.sendEmail) {
      await sendEmail({
        to: email,
        name,
        lastName,
        expoName,
        qrPath
      });
    }

    res.status(200).json({ message: 'Webhook received and processed', badgeID });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
