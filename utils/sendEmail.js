const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();


const sendEmail = async ( subject, send_to, message , sent_from, ) => {
  const transporter = nodemailer.createTransport({
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

 await transporter.sendMail(mailOptions, function (){
console.log("mail sent successfully");
  }
);
};

module.exports = sendEmail;
