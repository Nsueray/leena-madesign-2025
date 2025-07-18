require('dotenv').config();
const sendReminderRoute = require('./routes/sendReminder');
const reminderStatsRoute = require('./routes/reminderStats'); // ✅ yeni eklendi
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3011;
const webhookRoute = require('./routes/webhook');
const downloadDb = require('./routes/downloadDb');
const exhibitorRegister = require('./routes/exhibitorRegister');
const visitorMassImport = require('./routes/visitorMassimport'); // ✅ yeni eklendi
const apiExhibitors = require('./routes/apiExhibitors');
const apiCheckinsSqlite = require('./routes/apiCheckinsSqlite');
const sendCheckinReport = require('./routes/sendCheckinReport'); // ✅ yeni eklendi

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/webhook', webhookRoute);

app.use('/api/visitors', require('./routes/apiVisitors'));
app.use('/api/checkins', require('./routes/apiCheckins'));
app.use('/register', require('./routes/register'));
app.use('/download-db', downloadDb);
app.use('/api/send-reminder', sendReminderRoute);
app.use('/api/reminder-stats', reminderStatsRoute); // ✅ yeni eklendi
app.use('/api/exhibitor-register', exhibitorRegister);
app.use('/api/exhibitors', apiExhibitors);
app.use('/api/checkins-sqlite', apiCheckinsSqlite);
app.use('/api/send-checkin-report', sendCheckinReport); // ✅ eklendi
// app.use('/api/visitor-massimport', visitorMassImport); // ❌ kaldırıldı
app.use('/massimport', visitorMassImport); // ✅ artık frontend ile uyumlu

app.get('/onsiteregistration005.html', (req, res) => {
  res.redirect(301, '/form-onsite.html');
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
