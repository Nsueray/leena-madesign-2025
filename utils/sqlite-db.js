const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = '/data/visitors.db';
const db = new sqlite3.Database(dbPath);

// Ensure table exists
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
      source TEXT,
      origin TEXT,
      expoName TEXT,
      timeStamp TEXT,
      checkInTime TEXT
    )
  `);
});

/**
 * Inserts a visitor into the SQLite DB
 */
function insertVisitor(visitor) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO visitors (
        badgeID, name, lastName, email, company, country, jobTitle, source,
        origin, expoName, timeStamp, checkInTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitor.badgeID,
        visitor.name,
        visitor.lastName,
        visitor.email,
        visitor.company,
        visitor.country,
        visitor.jobTitle,
        visitor.source,
        visitor.origin,
        visitor.expoName,
        visitor.timeStamp,
        visitor.checkInTime
      ],
      function (err) {
        if (err) {
          console.error("❌ insertVisitor error:", err.message);
          return reject(err);
        }
        console.log("✅ Visitor saved:", visitor.badgeID);
        resolve();
      }
    );
  });
}

module.exports = {
  insertVisitor
};
