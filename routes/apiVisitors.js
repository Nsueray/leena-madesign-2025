const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const visitorsFile = path.join(__dirname, '../data/visitors.json');

router.get('/', (req, res) => {
  if (!fs.existsSync(visitorsFile)) return res.json([]);
  const data = fs.readFileSync(visitorsFile);
  res.json(JSON.parse(data));
});

module.exports = router;
