const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const dbPath = path.join(__dirname, '../data/checkins.db');
const db = new sqlite3.Database(dbPath);

function formatRow(row) {
  return `${row.date}: ${row.count} check-ins`;
}

function groupByField(rows, field) {
  const grouped = {};
  for (const row of rows) {
    const key = row[field] || 'Unknown';
    grouped[key] = (grouped[key] || 0) + 1;
  }
  return grouped;
}

router.post('/', async (req, res) => {
  try {
    db.all("SELECT * FROM checkins", [], async (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database read error' });

      const byDay = {};
      const bySource = {};
      const byOrigin = {};
      const byCountry = {};

      for (const row of rows) {
        const date = row.checkInTime?.slice(0, 10) || 'Unknown';
        byDay[date] = (byDay[date] || 0) + 1;
        bySource[row.source || 'Unknown'] = (bySource[row.source || 'Unknown'] || 0) + 1;
        byOrigin[row.origin || 'Unknown'] = (byOrigin[row.origin || 'Unknown'] || 0) + 1;
        byCountry[row.country || 'Unknown'] = (byCountry[row.country || 'Unknown'] || 0) + 1;
      }

      const lines = (obj) =>
        Object.entries(obj)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `<li><b>${k}:</b> ${v}</li>`)
          .join('');

      const html = `
        <h2>Check-in Summary Report</h2>
        <p>Total check-ins: <b>${rows.length}</b></p>

        <h3>By Day</h3><ul>${lines(byDay)}</ul>
        <h3>By Source</h3><ul>${lines(bySource)}</ul>
        <h3>By Origin</h3><ul>${lines(byOrigin)}</ul>
        <h3>By Country</h3><ul>${lines(byCountry)}</ul>
      `;

      await sgMail.send({
        to: 'suer@elan-expo.com',
        from: process.env.FROM_EMAIL,
        subject: 'Madesign Expo Check-in Summary Report',
        html,
      });

      res.json({ success: true });
    });
  } catch (e) {
    console.error('❌ Report error:', e);
    res.status(500).json({ error: 'Failed to send report' });
  }
});

module.exports = router;
