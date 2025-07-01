const sgMail = require('@sendgrid/mail');
const fs = require('fs');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, fullName, attachments }) {
  const qrAttachment = attachments[0]; // varsayılan olarak bir tane var
  const qrBase64 = fs.readFileSync(qrAttachment.path).toString('base64');

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: `Votre badge pour ${process.env.EVENT_NAME || "l'événement"}`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px;">
        <p>Bonjour <strong>${fullName}</strong>,</p>
        <p>Merci pour votre inscription à ${process.env.EVENT_NAME || "l'événement"}.</p>
        <p>Veuillez trouver ci-dessous votre code QR personnel :</p>
        <img src="cid:qrcode" alt="QR Code" style="margin:20px 0;" />
        <p>Nous avons hâte de vous accueillir !</p>
        <p style="margin-top: 30px;">Cordialement,<br/>Équipe Elan Expo</p>
      </div>
    `,
    attachments: [
      {
        content: qrBase64,
        filename: 'qrcode.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'qrcode'
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
