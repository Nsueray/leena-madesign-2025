const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createQRAndSendEmail } = require('../utils/sendEmail');
const db = require('../utils/sqlite-db');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const sendEmails = req.body.sendEmails === 'true';
    const emailTemplate = req.body.emailTemplate || '';
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded.');

    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let imported = 0;
    let emailsSent = 0;

    for (let row of data) {
      if (!row.Email || !row['Visitor Name'] || !row['Visitor Last Name'] || !row.Company) continue;

      const badgeID = 'MI' + Date.now() + Math.floor(Math.random() * 1000);
      const visitor = {
        badgeID,
        name: row['Visitor Name'],
        lastName: row['Visitor Last Name'],
        email: row.Email,
        company: row.Company,
        jobTitle: row['Job Title']?.trim() !== '' ? row['Job Title'] : 'N/A',
        country: row['Country.'] || '',
        phone: row.Mobile || '',
        sector: row.Sector || '',
        origin: 'massimport',
        source: row['Visitor Source'] || '',
        expoName: row['Expo Name'] || '',
        timeStamp: new Date().toISOString(),
        checkInTime: ''
      };

      await db.insertVisitor(visitor);
      imported++;

      if (sendEmails) {
        await createQRAndSendEmail(visitor, badgeID, emailTemplate);
        emailsSent++;
      }
    }

    fs.unlinkSync(file.path);
    res.json({ imported, emailsSent });
  } catch (err) {
    console.error('❌ Import error:', err);
    res.status(500).json({ message: 'Server error during import.' });
  }
});

module.exports = router;
