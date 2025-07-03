require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3011;
const webhookRoute = require('./routes/webhook');
const downloadDb = require('./routes/downloadDb');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/webhook', webhookRoute);

app.use('/api/visitors', require('./routes/apiVisitors'));
app.use('/api/checkins', require('./routes/apiCheckins'));
app.use('/register', require('./routes/register'));
app.use('/download-db', downloadDb);

const massImportRoute = require('./routes/massImport');
app.use('/massimport', massImportRoute);

app.get('/onsiteregistration005.html', (req, res) => {
  res.redirect(301, '/form-onsite.html');
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
