const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();



const sendEmail = async ( subject, send_to, message , sent_from, ) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port:587,  
    secure:false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
  });

  const mailOptions = {
    from: sent_from,
    to: send_to,
    subject: subject,
    html: message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("mail sent successfully", info);
    return info;
  } catch (err) {
    console.error("mail not sent", err);
    throw err;
  }
};

module.exports = sendEmail;

