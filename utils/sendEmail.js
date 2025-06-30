const sgMail = require('@sendgrid/mail');
const fs = require('fs');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, fullName, attachments = [] }) {
  const preparedAttachments = attachments.map(file => ({
    content: fs.readFileSync(file.path).toString('base64'),
    filename: file.filename,
    type: 'image/png',
    disposition: 'attachment'
  }));

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://madesignmaroc.com/2025/logo-elanexpo.png" alt="Elan Expo" style="height: 50px;" />
      </div>

      <h2 style="color: #0066cc;">🎫 Votre code QR pour Madesign Morocco 2025</h2>
      <p>Bonjour <strong>${fullName}</strong>,</p>
      <p>Merci pour votre inscription à <strong>Madesign Morocco 2025</strong>.</p>
      <p>Veuillez trouver votre code QR personnel en pièce jointe. Présentez ce code à l'entrée de l'événement.</p>

      <hr style="margin: 30px 0;" />

      <h3 style="font-size: 14px; font-weight: normal; color: #555;"><em>🎫 Your QR Code for Madesign Morocco 2025</em></h3>
      <p style="font-size: 14px;"><em>Hello <strong>${fullName}</strong>,</em></p>
      <p style="font-size: 14px;"><em>Thank you for registering for <strong>Madesign Morocco 2025</strong>.</em></p>
      <p style="font-size: 14px;"><em>Your personal QR code is attached. Please present it at the event entrance.</em></p>

      <br />
      <p style="font-size: 13px;">L'équipe Elan Expo<br /><em>Elan Expo Team</em></p>
    </div>
  `;

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: 'Votre code QR – Madesign Morocco 2025',
    html: htmlContent,
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
