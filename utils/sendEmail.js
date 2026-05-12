const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();


const sendEmail = async ( subject, send_to, message , sent_from, ) => {
  const transporter = nodemailer.createTransport({
    secure: 'false',
    port:587,  
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
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
