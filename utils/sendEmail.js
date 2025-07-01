const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, fullName, expoName, attachments = [] }) {
  const templatePath = path.join(__dirname, '../email_templates/qr-default.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');

  const qrAttachment = attachments.find(att => att.filename === 'qrcode.png');
  const qrBase64 = fs.readFileSync(qrAttachment.path).toString('base64');

  htmlContent = htmlContent
    .replace(/\[FULLNAME\]/g, fullName)
    .replace(/\[EXPO\]/g, expoName)
    .replace(/\[QR_IMAGE\]/g, `cid:qrcode@inline`);

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: `Votre badge pour l'événement`,
    html: htmlContent,
    attachments: [
      {
        content: qrBase64,
        filename: 'qrcode.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'qrcode@inline'
      },
      {
        content: qrBase64,
        filename: 'qrcode.png',
        type: 'image/png',
        disposition: 'attachment'
      }
    ]
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email error:', err.response?.body || err.message);
  }
}

module.exports = sendEmail;
