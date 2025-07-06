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
    const skipExisting = req.body.skipExisting === 'true';  // Eğer var ise
    const emailTemplate = req.body.emailTemplate || '';
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded.' });

    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let imported = 0;
    let emailsSent = 0;

    for (let row of data) {
      if (!row.Email || !row['Visitor Name'] || !row['Visitor Last Name'] || !row.Company) continue;

      // Eğer varsa, mevcut e-posta atlaması
      if (skipExisting) {
        const exists = await new Promise((resolve, reject) => {
          db.get(`SELECT 1 FROM visitors WHERE email = ?`, [row.Email], (err, r) => {
            if (err) return reject(err);
            resolve(!!r);
          });
        });
        if (exists) continue;
      }

      const badgeID = 'MI' + Date.now() + Math.floor(Math.random() * 1000);
      const jobTitle = row['Job Title']?.trim() || 'N/A';
      const visitor = {
        badgeID,
        name: row['Visitor Name'],
        lastName: row['Visitor Last Name'],
        email: row.Email,
        company: row.Company,
        country: row['Country.'] || '',
        jobTitle,
        phone: row.Mobile || '',
        sector: row.Sector || '',
        origin: 'massimport',
        source: row['Visitor Source'] || '',
        expoName: row['Expo Name'] || '',
        timeStamp: new Date().toISOString(),
        checkInTime: null
      };

      // SQLite'a kaydet
      await new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO visitors (
            badgeID, name, lastName, email, company, country, jobTitle, phone,
            sector, origin, source, expoName, timeStamp, checkInTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
          visitor.badgeID,
          visitor.name,
          visitor.lastName,
          visitor.email,
          visitor.company,
          visitor.country,
          visitor.jobTitle,
          visitor.phone,
          visitor.sector,
          visitor.origin,
          visitor.source,
          visitor.expoName,
          visitor.timeStamp,
          visitor.checkInTime
        ], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      imported++;

      // E-posta gönder
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
