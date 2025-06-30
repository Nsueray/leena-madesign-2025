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
    console.log("✅ Visitor saved:", newEntry.id || newEntry.fullName);
  } catch (err) {
    console.error("❌ Error writing visitors file:", err);
  }
}

router.post('/', async (req, res) => {
  try {
    const body = req.body;

    const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim();
    const badgeId = body.badgeNumber || Date.now().toString();
    const email = body.email || '';
    const company = body.companyName || '';
    const origin = 'zohoform';
    const source = body.visitorSource || '';

    if (!fullName || !email || !company) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const qrUrl = `/badge.html?badge_id=${badgeId}`;
    const qrPath = path.join(qrDir, `${badgeId}.png`);
    await QRCode.toFile(qrPath, `https://leena4-kenya-final-live.onrender.com${qrUrl}`);

    const newVisitor = {
      id: badgeId,
      fullName,
      email,
      company,
      origin,
      source,
      phone: body.phone || '',
      jobTitle: body.jobTitle || '',
      sector: body.sector || '',
      country: body.country || '',
      website: body.website || '',
      visitorCategory: body.visitorCategory || '',
      visitorStatus: body.visitorStatus || '',
      createdAt: new Date().toISOString()
    };

    const visitors = readVisitors();
    visitors.push(newVisitor);
    safeWriteVisitors(newVisitor);

    if (config.sendEmail) {
      await sendEmail({
        to: email,
        subject: config.emailSubject,
        text: config.emailBody.replace('[NAME]', fullName),
        attachments: [{ filename: 'qrcode.png', path: qrPath }]
      });
    }

    res.status(200).json({ message: 'Webhook received and processed', badgeId });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
