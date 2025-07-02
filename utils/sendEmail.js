const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const config = require('../config');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendEmail({ to, subject, name, lastName, expoName, qrPath }) {
  // Yedek isim oluştur
  const fullName = `${name || ''} ${lastName || ''}`.trim() || 'Participant';
  const expo = expoName || 'Event';

  // Şablon dosya yolu
  const htmlTemplatePath = path.join(__dirname, '../email_templates/qr-default.html');

  // QR dosyası var mı kontrol et
  if (!qrPath || !fs.existsSync(qrPath)) {
    console.error("❌ QR path is missing or file does not exist:", qrPath);
    return;
  }

  // HTML içeriğini oku ve değişkenleri yerleştir
  const htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8')
    .replace(/\[FULL_NAME\]/g, fullName)
    .replace(/\[EXPO_NAME\]/g, expo)
    .replace(/\[QR_IMAGE\]/g, `cid:qrcode`);

  const msg = {
    to,
    from: 'noreply@leena.app',
    subject: subject || `Votre code QR – ${expo}`,
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
