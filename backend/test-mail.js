const nodemailer = require('nodemailer');
require('dotenv').config();

const MAIL_USER = process.env.MAIL_USER;
const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD;

async function testMail() {
    console.log('Testing Email Configuration...');
    console.log('User:', MAIL_USER);
    console.log('Password set:', !!MAIL_APP_PASSWORD);

    if (!MAIL_USER || !MAIL_APP_PASSWORD) {
        console.error('Error: MAIL_USER or MAIL_APP_PASSWORD missing in .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: MAIL_USER,
            pass: MAIL_APP_PASSWORD,
        },
        connectionTimeout: 10000, // 10 seconds timeout
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('Connection verified successfully!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"OneMoreGift Test" <${MAIL_USER}>`,
            to: MAIL_USER, // Send to self
            subject: 'OneMoreGift - SMTP Test',
            text: 'If you are reading this, your SMTP configuration is working correctly!',
            html: '<b>If you are reading this, your SMTP configuration is working correctly!</b>',
        });

        console.log('Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('SMTP Error:', error);
        if (error.code === 'EAUTH') {
            console.error('\nPOSSIBLE CAUSE: Authentication failed. If using Gmail, make sure you generated an "App Password" and didn\'t just use your regular password.');
        } else if (error.code === 'ESOCKET') {
            console.error('\nPOSSIBLE CAUSE: Socket error. Your server or cloud provider (e.g., DigitalOcean) might be blocking outgoing SMTP ports (587/465).');
        }
    }
}

testMail();
