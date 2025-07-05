const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();            // ← burayı ekledik
const { createQRAndSendEmail } = require('../utils/sendEmail');

const upload = multer({ dest: 'uploads/' });
const dbPath = path.join('/data', 'visitors.db');
const db = new sqlite3.Database(dbPath);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const sendEmails = req.body.sendEmails === 'on';
    const emailTemplate = req.body.emailTemplate || '';
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded.' });

    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let imported = 0;
    let emailsSent = 0;

    for (const row of rows) {
      if (!row.Email || !row['Visitor Name'] || !row['Visitor Last Name'] || !row.Company) {
        continue;
      }
      imported++;

      const badgeID = 'MI' + Date.now() + Math.floor(Math.random() * 1000);
      const visitor = {
        badgeID,
        name: row['Visitor Name'],
        lastName: row['Visitor Last Name'],
        email: row.Email,
        company: row.Company,
        country: row['Country.'] || '',
        jobTitle: row['Job Title']?.trim() || 'N/A',
        source: row['Visitor Source'] || '',
        origin: 'massimport',
        expoName: row['Expo Name'] || '',
        timeStamp: new Date().toISOString(),
        checkInTime: ''
      };

      // SQLite'a kaydet
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO visitors (
             badgeID, name, lastName, email, company, country,
             jobTitle, source, origin, expoName, timeStamp, checkInTime
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            visitor.badgeID,
            visitor.name,
            visitor.lastName,
            visitor.email,
            visitor.company,
            visitor.country,
            visitor.jobTitle,
            visitor.source,
            visitor.origin,
            visitor.expoName,
            visitor.timeStamp,
            visitor.checkInTime
          ],
          err => (err ? reject(err) : resolve())
        );
      });

      // E-posta gönder
      if (sendEmails) {
        await createQRAndSendEmail(visitor, badgeID, emailTemplate);
        emailsSent++;
      }
    }

    fs.unlinkSync(file.path);
    return res.json({ imported, emailsSent });
  } catch (err) {
    console.error('❌ Import error:', err);
    return res.status(500).json({ message: 'Server error during import.' });
  }
});

module.exports = router;
