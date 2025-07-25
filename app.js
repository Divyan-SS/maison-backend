// app.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const {
  adminMailTemplate,
  userConfirmationTemplate,
  userResponseTemplate,
} = require('./emailTemplates');

const app = express();
const PORT = 5000;
const SENDER_EMAIL = 'divyansample1@gmail.com';
const SENDER_PASS = 'spvwralflmgzxsxj';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

let bookings = {}; // In-memory store

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr.toUpperCase();
  }

  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  if (isNaN(hour)) return timeStr;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${suffix}`;
};

let transporterPromise = Promise.resolve(
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SENDER_EMAIL,
      pass: SENDER_PASS,
    },
  })
);

async function getTransporter() {
  return await transporterPromise;
}

app.post('/api/book', async (req, res) => {
  const { name, email, date, time, members } = req.body;

  if (!name || !email || !date || !time || !members) {
    return res.status(400).json({ success: false, message: 'All booking fields are required.' });
  }

  const bookingId = Math.random().toString(36).substring(2, 10);
  const formattedTime = formatTime(time);

  bookings[bookingId] = {
    name,
    email,
    date,
    time: formattedTime,
    members,
    status: 'pending',
  };

  try {
    const adminMail = adminMailTemplate(
      bookingId,
      name,
      email,
      date,
      formattedTime,
      members,
      'https://maison-backend-vsx4.onrender.com'
    );
    const userMail = userConfirmationTemplate(name, date, formattedTime, members);
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: `"Maison d'Élite" <${SENDER_EMAIL}>`,
      to: SENDER_EMAIL,
      subject: adminMail.subject,
      html: adminMail.html,
    });

    await transporter.sendMail({
      from: `"Maison d'Élite" <${SENDER_EMAIL}>`,
      to: email,
      subject: userMail.subject,
      html: userMail.html,
    });

    res.status(200).json({ success: true, message: 'Booking request sent.' });
  } catch (err) {
    console.error('📧 Email sending failed:', err);
    res.status(500).json({
      success: false,
      message: 'Booking Failed ❌\nFailed to send emails.',
    });
  }
});

app.get('/admin/respond', (req, res) => {
  const { bookingId } = req.query;
  const booking = bookings[bookingId];

  if (!booking) {
    return res.send('<h3>❌ Invalid or expired booking ID.</h3>');
  }

  res.send(`
  <html>
    <head>
      <title>Respond to Booking | Maison d'Élite</title>
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <style>
        body {
          background: linear-gradient(135deg, #8EC5FC, #E0C3FC);
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: white;
          padding: 30px 40px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Responding to Booking</h2>
        <p>Preparing response form...</p>
      </div>

      <script>
        const bookingId = "${bookingId}";

        async function showResponseDialog() {
          const { value: status } = await Swal.fire({
            title: 'Respond to Booking',
            input: 'radio',
            inputOptions: {
              accepted: '✅ Accept',
              try_next: '⏳ Try Next Time',
              limited: '🚨 Limited Seats',
              full: '❌ Fully Booked'
            },
            inputValidator: (value) => !value && 'Please choose a response!',
            confirmButtonText: 'Next',
            showCancelButton: true
          });

          if (!status) return;

          if (status === 'limited') {
            const { value: seats } = await Swal.fire({
              title: 'Enter Available Seats',
              input: 'number',
              inputAttributes: { min: 1 },
              inputLabel: 'How many seats are available?',
              confirmButtonText: 'Send',
              inputValidator: (value) => (!value || value <= 0) && 'Enter valid number of seats',
              showCancelButton: true
            });

            if (seats) submitResponse(status, seats);
          } else {
            submitResponse(status);
          }
        }

        function submitResponse(status, seats = null) {
          const url = 'https://maison-backend-vsx4.onrender.com/api/respond?bookingId=' + bookingId + '&status=' + status + (seats ? '&seats=' + seats : '');

          fetch(url)
            .then(res => res.text())
            .then(msg => {
              Swal.fire({
                icon: 'success',
                title: 'Response Sent!',
                html: msg
              }).then(() => {
                document.body.innerHTML = '<h3 style="text-align:center;">✅ Response successfully submitted.</h3>';
              });
            })
            .catch(err => Swal.fire('Error', err.message, 'error'));
        }

        showResponseDialog();
      </script>
    </body>
  </html>
  `);
});

app.get('/api/respond', async (req, res) => {
  const { bookingId, status, seats } = req.query;
  const booking = bookings[bookingId];

  if (!booking) {
    return res.status(404).send('Booking not found.');
  }

  booking.status = status;

  try {
    const userMail = userResponseTemplate(
      booking.name,
      status,
      booking.date,
      booking.time,
      booking.members,
      seats
    );
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: booking.email,
      subject: userMail.subject,
      html: userMail.html,
    });

    res.status(200).send(`<h3>${status.toUpperCase()} response sent successfully.</h3><p>Email sent to <b>${booking.email}</b>.</p>`);
  } catch (error) {
    console.error('❌ Respond email error:', error);
    res.status(500).send('Failed to send response email.');
  }
});

// ✅ FIXED CONTACT FORM HANDLER
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const escapeHTML = (text) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

  const safeName = escapeHTML(name);
  const safeEmail = escapeHTML(email);
  const safeMessage = escapeHTML(message).replace(/\n/g, '<br>');

  try {
    const transporter = await getTransporter();

    // Send to admin and user both inside try
    await transporter.sendMail({
      from: `"Maison d'Élite Contact" <${SENDER_EMAIL}>`,
      to: SENDER_EMAIL,
      replyTo: email,
      subject: `📩 New Contact Form Message from ${safeName}`,
      html: `
        <h2>New Contact Message Received</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong><br>${safeMessage}</p>
        <hr>
        <p style="font-size:12px;color:#888;">Maison d'Élite | Contact Form Submission</p>
      `,
    });

    await transporter.sendMail({
      from: `"Maison d'Élite" <${SENDER_EMAIL}>`,
      to: email,
      subject: `✅ We've received your message - Maison d'Élite`,
      html: `
        <h3>Hi ${safeName},</h3>
        <p>Thank you for contacting <strong>Maison d'Élite</strong>.</p>
        <p>We’ve received your message and will respond shortly.</p>
        <p><strong>Your message:</strong><br>${safeMessage}</p>
        <br>
        <p>Warm regards,<br><strong>The Maison d'Élite Team</strong></p>
        <hr>
        <p style="font-size:12px;color:#888;">This is an automated response. Please do not reply.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
    });

  } catch (error) {
    console.error('📩 Contact form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Maison d'Élite backend running at http://localhost:${PORT}`);
});
