const fs = require('fs');
const path = require('path');

const visitorsFile = '/data/visitors.json';

function safeWriteVisitors(newData) {
  let visitors = [];

  try {
    if (fs.existsSync(visitorsFile)) {
      const fileData = fs.readFileSync(visitorsFile, 'utf8');
      visitors = JSON.parse(fileData);
    }
  } catch (err) {
    console.error("❌ Error reading visitors file:", err);
  }

  // Gelen data dizi ise birleştir, değilse ekle
  if (Array.isArray(newData)) {
    visitors.push(...newData);
  } else {
    visitors.push(newData);
  }

  try {
    fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2));
    console.log(`✅ Visitors saved: ${Array.isArray(newData) ? newData.length : 1}`);
  } catch (err) {
    console.error("❌ Error writing visitors file:", err);
  }
}

module.exports = { safeWriteVisitors };
