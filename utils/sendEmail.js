const sgMail = require('@sendgrid/mail');
const fs = require('fs');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, text, attachments = [] }) {
  const preparedAttachments = attachments.map(file => ({
    content: fs.readFileSync(file.path).toString('base64'),
    filename: file.filename,
    type: 'image/png',
    disposition: 'attachment'
  }));

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject,
    text,
    attachments: preparedAttachments
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email error:', err.response?.body || err.message);
  }
}

module.exports = sendEmail;
