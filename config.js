module.exports = {
  organizerName: "Elan Expo",
  eventName: "Mega Clima Kenya 2025",
  emailSubject: "Your Mega Clima Kenya 2025 QR Code",
  emailBody: `
    Dear [NAME],

    Thank you for registering for Mega Clima Kenya 2025.
    Please find your personal QR code attached below.

    We look forward to welcoming you at the event.

    Kind regards,  
    Elan Expo Team
  `,
  badgeFields: ["fullName", "company"],
  badgeSize: {
    width: "100mm",
    height: "50mm",
    orientation: "landscape"
  },
  sendEmail: true,
  showQRCode: true
};
