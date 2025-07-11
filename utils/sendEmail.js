const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const config = require('../config');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendEmail({ to, subject, name, lastName, expoName, qrPath }) {
  const htmlTemplatePath = path.join(__dirname, '../email_templates/qr-default.html');
  const htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8')
    .replace(/\[NAME\]/g, name || '')
    .replace(/\[LAST_NAME\]/g, lastName || '')
    .replace(/\[EXPO_NAME\]/g, expoName || '')
    .replace(/\[QR_IMAGE\]/g, `cid:qrcode`);

  const msg = {
    to,
    from: 'noreply@leena.app',
    subject: subject || `Votre code QR – ${expoName}`,
    html: htmlContent,
    attachments: [
      {
        content: fs.readFileSync(qrPath).toString("base64"),
        filename: "qrcode.png",
        type: "image/png",
        disposition: "inline",
        content_id: "qrcode"
      }
    ]
  };

  return sgMail.send(msg).then(() => {
    console.log("✅ Email sent to", to);
  }).catch(err => {
    console.error("❌ Error sending email:", err);
  });
}

module.exports = sendEmail;
