const nodemailer = require('nodemailer');

const sendEmail = async ( subject, send_to, message , sent_from, reply_to) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: message
  };

  await transporter.sendMail(mailOptions, function (err, info){
    if (err){
        console.log(err);
        
    }
    else{
    console.log(info)
    }
   

  }
);
};
module.exports = sendEmail;