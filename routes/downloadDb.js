const express = require('express');
const path = require('path');
const router = express.Router();
const dbPath = '/data/visitors.db';

router.get('/', (req, res) => {
  res.download(dbPath, 'visitors.db', err => {
    if (err) {
      console.error("❌ Error downloading DB:", err);
      res.status(500).send("Download failed.");
    }
  });
});

module.exports = router;
