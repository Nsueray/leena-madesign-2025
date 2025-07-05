const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createQRAndSendEmail } = require('../utils/sendEmail');
// const { safeWriteVisitors } = require('../utils/safeWriteVisitors');
const db = require('../utils/sqlite-db'); // örnek: burada sqlite3.Database bağlantınızı alın

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const sendEmails = !!req.body.sendEmails;       // artık checkbox=on da true olur
    const emailTemplate = req.body.emailTemplate || '';
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded.');

    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let imported = 0, emailsSent = 0;

    for (let row of data) {
      if (!row.Email || !row['Visitor Name'] || !row['Visitor Last Name'] || !row.Company) continue;
      imported++;

      const badgeId = 'MI' + Date.now() + Math.floor(Math.random()*1000);
      const visitor = {
        badgeID: badgeId,
        name: row['Visitor Name'],
        lastName: row['Visitor Last Name'],
        email: row.Email,
        company: row.Company,
        jobTitle: row['Job Title']?.trim()||'N/A',
        country: row['Country.']||'',
        phone: row.Mobile||'',
        sector: row.Sector||'',
        origin: 'massimport',
        source: row['Visitor Source']||'',
        expoName: row['Expo Name']||'',
        timeStamp: new Date().toISOString(),
        checkInTime: ''  // veya null
      };

      // 1) DB'ye kaydet (register.js içindeki INSERT sorgusunu kopyalayın)
      await new Promise((done, fail) => {
        db.run(
          `INSERT INTO visitors 
            (badgeID,name,lastName,email,company,country,jobTitle,source,origin,expoName,timeStamp,checkInTime)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          Object.values(visitor),
          err => err ? fail(err) : done()
        );
      });

      // 2) e-posta
      if (sendEmails) {
        await createQRAndSendEmail(visitor, badgeId, emailTemplate);
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
