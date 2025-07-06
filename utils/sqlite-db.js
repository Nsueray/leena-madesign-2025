// utils/sqlite-db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, '../data/visitors.db');

// DB açılırken tabloyu da oluştur
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Cannot open SQLite database:', err);
    process.exit(1);
  }
  console.log('✅ SQLite database opened:', dbPath);
});

// Tablo yoksa oluştur
db.run(`
  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badgeID TEXT UNIQUE,
    name TEXT,
    lastName TEXT,
    email TEXT,
    company TEXT,
    country TEXT,
    jobTitle TEXT,
    phone TEXT,
    sector TEXT,
    origin TEXT,
    source TEXT,
    expoName TEXT,
    timeStamp TEXT,
    checkInTime TEXT
  )
`, (err) => {
  if (err) {
    console.error('❌ Cannot create visitors table:', err);
  }
});

module.exports = db;
