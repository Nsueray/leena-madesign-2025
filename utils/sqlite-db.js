const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosya yolu
const dbPath = path.join(__dirname, '../data/visitors.db');

// Veritabanını aç
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite bağlantı hatası:', err);
  } else {
    console.log('✅ SQLite veritabanı açıldı:', dbPath);
  }
});

// Tabloyu oluştur (yoksa)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      badgeID TEXT PRIMARY KEY,
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
  `);
});

module.exports = db;
