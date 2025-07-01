const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const visitorsFile = path.join('/data', 'visitors.json');

router.get('/', (req, res) => {
  if (!fs.existsSync(visitorsFile)) return res.json([]);
  try {
    const data = JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error('❌ Error reading visitors:', err);
    res.status(500).json({ error: 'Could not load visitors' });
  }
});

module.exports = router;
