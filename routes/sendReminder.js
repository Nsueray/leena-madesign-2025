// 1. Aşağıdaki kodu yeni bir dosya olarak kaydedeceğiz:
// Dosya: routes/sendReminder.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();
const db = new sqlite3.Database('/data/visitors.db');

router.post('/', (req, res) => {
  const { selectedDate, expoName, emailSubject, emailHtml } = req.body;
  if (!selectedDate || !expoName || !emailSubject || !emailHtml) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `
    SELECT * FROM visitors
    WHERE DATE(timeStamp) = ? AND expoName = ? AND (checkInTime IS NULL OR checkInTime = '')
  `;

  db.all(sql, [selectedDate, expoName], async (err, rows) => {
    if (err) {
      console.error('❌ SQLite error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Aynı email adresine birden fazla email gönderilmemesi için
    const seenEmails = new Set();
    const uniqueVisitors = rows.filter(v => {
      if (seenEmails.has(v.email)) return false;
      seenEmails.add(v.email);
      return true;
    });

    let sent = 0;
    for (const v of uniqueVisitors) {
      try {
        await sendEmail({
          to: v.email,
          subject: emailSubject,
          html: emailHtml
        });
        sent++;
        console.log(`✅ Reminder sent to ${v.email}`);
      } catch (err) {
        console.error(`❌ Failed to send to ${v.email}:`, err);
      }
    }

    res.json({ message: `Reminder sent to ${sent} unique emails.` });
  });
});

module.exports = router;
