const nodemailer = require('nodemailer');

// Send OTP email function
const sendOTP = async ({ email, otp }) => {
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER, // Your SMTP username
                pass: process.env.SMTP_PASS, // Your SMTP password
            },
        });

        // Define the email options
        const message = {
            from: `"Your App Name" <${process.env.SMTP_USER}>`, // Sender address
            to: email, // Receiver's email address
            subject: 'Your OTP Code', // Subject line
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`, // Plain text body
        };

        // Send the email
        await transporter.sendMail(message);

        console.log(`OTP sent to: ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('OTP email could not be sent');
    }
};

module.exports = sendOTP;
