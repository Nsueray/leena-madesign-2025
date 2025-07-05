const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createQRAndSendEmail } = require('../utils/sendEmail');
const { safeWriteVisitors } = require('../utils/safeWriteVisitors');

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

    let visitors = [];
    let emailsSent = 0;

    for (let row of data) {
      if (!row.Email || !row['Visitor Name'] || !row['Visitor Last Name'] || !row.Company) continue;

      const fullName = `${row['Visitor Name']} ${row['Visitor Last Name']}`;
      const badgeId = 'MI' + Date.now() + Math.floor(Math.random() * 1000);

      const visitor = {
        fullName,
        email: row.Email,
        company: row.Company,
        jobTitle: row['Job Title']?.trim() !== '' ? row['Job Title'] : 'N/A',
        country: row['Country.'] || '',
        phone: row.Mobile || '',
        sector: row.Sector || '',
        badgeId,
        origin: 'massimport',
        source: row['Visitor Source'] || '',
        expoName: row['Expo Name'] || '',
        createdAt: new Date().toISOString()
      };

      if (sendEmails) {
        await createQRAndSendEmail(visitor, badgeId, emailTemplate);
        emailsSent++;
      }

      visitors.push(visitor);
    }

    await safeWriteVisitors(visitors);
    fs.unlinkSync(file.path);

    res.json({ imported: visitors.length, emailsSent });
  } catch (err) {
    console.error('❌ Import error:', err);
    res.status(500).send('Server error during import.');
  }
});

module.exports = router;
