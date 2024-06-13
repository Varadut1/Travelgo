const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // create a transporteor
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD
        }
    })
    // email options
    const mailOptions = {
        from: 'Varad Uttarwar <varad@utt.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: 
    }

    //send email
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail;