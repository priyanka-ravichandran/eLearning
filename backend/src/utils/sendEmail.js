const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    logger: true,
    debug: true,
    secureConnection: false,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: true,
    },
});

const sendMail = async (receiver_mail, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: receiver_mail,
        subject: subject,
        html: html,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
};

module.exports = sendMail;
