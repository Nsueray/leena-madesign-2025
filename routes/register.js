const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const config = require('../config');
const sendEmail = require('../utils/sendEmail');
const { safeWriteVisitors } = require('../utils/safeWriteVisitors');

const router = express.Router();

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
    name, lastName, email,
    badgeID, company, country,
    jobTitle: cleanedJobTitle,
    source, origin, expoName,
    timeStamp: new Date().toISOString(),
    checkInTime: null
  };

  safeWriteVisitors(newVisitor);

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

  res.json({ message: 'Visitor registered', badgeID });
});

module.exports = router;
