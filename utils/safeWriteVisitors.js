const fs = require('fs');
const path = require('path');

// Persistent disk mount
const visitorsFile = path.join('/data', 'visitors.json');

function readVisitorsFile() {
  if (!fs.existsSync(visitorsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
  } catch (err) {
    console.error('❌ Error parsing visitors.json:', err);
    return [];
  }
}

function safeWriteVisitors(newEntries) {
  const visitors = Array.isArray(newEntries)
    ? newEntries
    : [...readVisitorsFile(), newEntries];

  try {
    fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2), 'utf8');
    console.log(`✅ Visitors written to disk (${visitorsFile})`);
  } catch (err) {
    console.error('❌ Error writing visitors file:', err);
  }
}

module.exports = { readVisitorsFile, safeWriteVisitors };
