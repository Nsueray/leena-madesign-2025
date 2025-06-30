
const fs = require('fs');
const path = require('path');

const VISITOR_FILE = path.join(__dirname, '../data/visitors.json');

function safeWriteVisitors(newVisitors) {
  try {
    let existing = [];
    if (fs.existsSync(VISITOR_FILE)) {
      const raw = fs.readFileSync(VISITOR_FILE, 'utf8');
      existing = JSON.parse(raw);
    }

    // Mevcutlara yenileri ekle
    const merged = [...existing, ...newVisitors];

    fs.writeFileSync(VISITOR_FILE, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`✅ Added ${newVisitors.length} new visitors (total: ${merged.length})`);
  } catch (err) {
    console.error('❌ Error writing visitors.json:', err);
  }
}

module.exports = { safeWriteVisitors };
