class MailSender {
  nodemailer;
  transporter;
  mailfrom;
  tomail;
  sub;
  message;

  constructor(to, sub, msg) {
    this.mailfrom = 'adityawatekar835@gmail.com'; // can be anything, Mailtrap ignores it
    this.tomail = to;
    this.sub = sub;
    this.message = msg;

    this.nodemailer = require('nodemailer');

    // Mailtrap SMTP setup
    this.transporter = this.nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525, // or 587, 465
      auth: {
        user: "ef6b438ae1972f", // Mailtrap SMTP username
        pass: "3b69ebe2da89f3" // Mailtrap SMTP password
      }
    });

    console.log('Mail object created using Mailtrap');
  }

  send() {
    console.log("Sending mail...");

    const mailOptions = {
      from: this.mailfrom,
      to: this.tomail,
      subject: this.sub,
      html: this.message
    };

    this.transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log('Email sent successfully! Info:', info.response);
      }
    });
  }
}

module.exports = MailSender;
