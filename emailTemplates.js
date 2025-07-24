// emailTemplates.js
const formatTime = (timeStr) => {
  // If it's already in AM/PM format, return as-is
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr.toUpperCase();
  }

  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${suffix}`;
};

function adminMailTemplate(bookingId, name, email, date, time, members, port) {
  const formattedTime = formatTime(time);

  return {
    subject: '📩 New Table Reservation Request – Maison d\'Élite',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; background-color: #fefefe; border-radius: 10px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50; text-align: center;">📅 New Reservation Request</h2>
        <p style="font-size: 16px;"><strong>Booking ID:</strong> ${bookingId}</p>
        <p style="font-size: 16px;"><strong>Name:</strong> ${name}</p>
        <p style="font-size: 16px;"><strong>Email:</strong> ${email}</p>
        <p style="font-size: 16px;"><strong>Date:</strong> ${date}</p>
        <p style="font-size: 16px;"><strong>Time:</strong> ${formattedTime}</p>
        <p style="font-size: 16px;"><strong>Members:</strong> ${members}</p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://maison-backend-vsx4.onrender.com/admin/respond?bookingId=${bookingId}" 
            style="background-color: #1abc9c; color: white; padding: 14px 28px; font-size: 16px; text-decoration: none; border-radius: 8px; display: inline-block;">
            📨 Respond to this Booking
          </a>
        </div>

        <p style="text-align: center; color: #888; font-size: 13px;">Maison d'Élite • Kindly review and respond promptly.</p>
      </div>
    `
  };
}

const userConfirmationTemplate = (name, date, time, members) => {
  const formattedTime = formatTime(time);

  return {
    subject: '✅ Maison d\'Élite Booking Request Received',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; background: #f9f9f9; border-radius: 10px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
        <h2 style="color: #27ae60; text-align: center;">✅ Your Table Reservation is Received</h2>

        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>

        <p style="font-size: 15px;">Thank you for your reservation request! 🙌<br/>
        We’ve received the following details:</p>

        <ul style="font-size: 15px; line-height: 1.8;">
          <li>👥 <strong>Members:</strong> ${members}</li>
          <li>📅 <strong>Date:</strong> ${date}</li>
          <li>⏰ <strong>Time:</strong> ${formattedTime}</li>
        </ul>

        <p style="font-size: 15px;"><strong>Status:</strong> <span style="color: #f39c12;">Pending Review</span><br/>
        Our team will verify availability and send you a confirmation shortly.</p>

        <hr style="border-top: 1px solid #ccc; margin: 25px 0;" />

        <p style="font-size: 15px;">We appreciate your interest and will do our best to accommodate your request.<br/>
        You’ll hear from us soon!</p>

        <p style="margin-top: 30px;">Warm regards,<br/>
        <strong>Maison d'Élite</strong> Team 🍽️</p>
      </div>
    `
  };
};

const userResponseTemplate = (name, status, date, time, members, availableSeats = null) => {
  const formattedTime = formatTime(time);

  let statusText = '';
  switch (status) {
    case 'accepted':
      statusText = `<strong>✅ Confirmed</strong> – Your table for <b>${members}</b> guest(s) on <b>${date}</b> at <b>${formattedTime}</b> is confirmed! 🎉`;
      break;
    case 'try_next':
      statusText = `<strong>⏳ Waitlist</strong> – All tables are currently booked for <b>${date}</b>. You’re added to the waitlist. We’ll notify you if any slots free up.`;
      break;
    case 'limited':
      statusText = `<strong>🚨 Limited Seats</strong> – Only <b>${availableSeats}</b> seat(s) are available at your requested time. Kindly consider rebooking within this limit.`;
      break;
    case 'full':
      statusText = `<strong>❌ Rejected</strong> – Unfortunately, all tables are booked for the selected slot. Please try another time.`;
      break;
    default:
      statusText = `Your booking status has been updated.`;
  }

  return {
    subject: '📢 Your Table Reservation Status – Maison d\'Élite',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; background: #fff; border-radius: 10px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
        <h2 style="color: #2980b9; text-align: center;">📢 Your Reservation Status</h2>

        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>

        <p style="font-size: 15px;">We’ve reviewed your reservation request:</p>

        <ul style="font-size: 15px; line-height: 1.8;">
          <li>👥 <strong>Members:</strong> ${members}</li>
          <li>📅 <strong>Date:</strong> ${date}</li>
          <li>⏰ <strong>Time:</strong> ${formattedTime}</li>
        </ul>

        <p style="font-size: 16px;">📌 <strong>Status:</strong><br/>${statusText}</p>

        <hr style="margin: 30px 0; border-top: 1px solid #ccc;" />

        <p style="color: #555;">If you have any questions or need assistance, feel free to reply to this email.</p>

        <p style="margin-top: 25px;">Thank you again for choosing <strong>Maison d'Élite</strong>!<br/>
        We hope to serve you soon. 🍴</p>
      </div>
    `
  };
};

module.exports = {
  adminMailTemplate,
  userConfirmationTemplate,
  userResponseTemplate
};
