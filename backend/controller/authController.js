const Users = require('../model/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const MAIL_USER = process.env.MAIL_USER;
const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const USER_COOKIE_NAME = 'user_token';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const userCookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? 'none' : 'lax',
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
};

const setUserCookie = (res, token) => {
    res.cookie(USER_COOKIE_NAME, token, userCookieOptions);
};

const clearUserCookie = (res) => {
    res.clearCookie(USER_COOKIE_NAME, {
        ...userCookieOptions,
        maxAge: undefined,
    });
};

const signUserToken = (user) => {
    const data = {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
    };
    return jwt.sign({ data }, JWT_SECRET, { expiresIn: '90d' });
};

const sendEmailFallback = async ({ to, subject, html }) => {
    if (!MAIL_USER || !MAIL_APP_PASSWORD) {
        console.error('Email Fallback Error: MAIL_USER or MAIL_APP_PASSWORD not configured');
        return false;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: MAIL_USER,
            pass: MAIL_APP_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: `OneMoreGift <${MAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Fallback Email sent successfully to: ${to}`);
        return true;
    } catch (error) {
        console.error('Fallback SMTP Error:', error.message);
        return false;
    }
};

const sendEmail = async ({ to, subject, html }) => {
    console.log(`Attempting to send email to: ${to} | Subject: ${subject}`);
    if (BREVO_API_KEY) {
        try {
            await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { email: 'no-reply@onemoregift.in' },
                to: [{ email: to }],
                htmlContent: html,
                subject,
            }, {
                headers: {
                    accept: 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json',
                },
            });
            console.log('Email sent via Brevo successfully');
            return true;
        } catch (error) {
            console.error('Brevo mail failed:', error?.response?.data || error.message);
        }
    }

    console.log('Using Gmail fallback for email...');
    return await sendEmailFallback({ to, subject, html });
};

const generateEmailTemplate = (title, message, code = '', extraHtml = '') => `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 16px; margin-top: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo span { font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #ffffff; }
        .logo .brand { color: #ef4444; }
        .content { background: #111111; padding: 30px; border-radius: 12px; border: 1px solid #222222; text-align: center; }
        h1 { color: #ffffff; font-size: 24px; margin-top: 0; margin-bottom: 10px; font-weight: 800; }
        p { color: #a3a3a3; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
        .otp-box { background: linear-gradient(145deg, #1f0b0b 0%, #0a0000 100%); border: 1px solid #3f1616; padding: 20px; border-radius: 12px; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; margin: 0; text-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #1f1f1f; color: #525252; font-size: 13px; }
        .link-btn { display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 10px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo"><span>OneMore<span class="brand">Gift</span></span></div>
        <div class="content">
            <h1>${title}</h1>
            <p>${message}</p>
            ${code ? `<div class="otp-box"><p class="otp-code">${code}</p></div>` : ''}
            ${extraHtml ? extraHtml : ''}
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} OneMoreGift. All rights reserved.</p></div>
    </div>
</body>
</html>`;

const register = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        if (!name) return res.status(400).json({ error: true, msg: 'Name is required' });
        if (!phone || !email || !password) {
            return res.status(400).json({ error: true, msg: 'All fields are required' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        let user = await Users.findOne({ $or: [{ email }, { phone }] });

        if (user) {
            if (user.isVerified === false) {
                user.name = name;
                user.email = email;
                user.phone = phone;
                user.password = hashedPassword;
                user.loginOtp = { token: otpHash, expires: otpExpiry, attempts: 0 };
                await user.save();
            } else {
                let errorMessage = 'A user with these details already exists';
                if (user.phone === phone) errorMessage = 'A user with that phone number already exists';
                if (user.email === email) errorMessage = 'A user with that email already exists';
                return res.status(409).json({ error: true, msg: errorMessage });
            }
        } else {
            user = await Users.create({
                phone,
                email,
                name,
                password: hashedPassword,
                isVerified: false,
                loginOtp: { token: otpHash, expires: otpExpiry, attempts: 0 }
            });
        }

        const sent = await sendEmail({
            to: email,
            subject: 'Verify your OneMoreGift account',
            html: generateEmailTemplate(
                'Verify Your Email Address',
                'Welcome to OneMoreGift! To complete your registration and secure your account, please enter the following verification code.',
                otpCode,
                '<p>This code will expire in <b>5 minutes</b>. Please do not share this code.</p>'
            )
        });

        if (!sent) {
            return res.status(500).json({ error: true, msg: 'Failed to send OTP email' });
        }

        return res.status(200).json({ error: false, msg: 'OTP sent to email', requiresOtp: true });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: true, msg: 'A user with these details already exists' });
        }
        return res.status(500).json({ error: true, msg: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: true, msg: 'Invalid email or password' });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: true, msg: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: true, msg: 'Invalid email or password' });
        }

        if (user.isVerified === false) {
            // Require them to verify their email before logging in.
            return res.status(403).json({
                error: true,
                msg: 'Please check your email to verify your account first. If you need a new code, try registering again.',
                unverified: true
            });
        }

        if (user.blocked) {
            return res.status(403).json({ error: true, msg: 'Your account is blocked' });
        }

        const token = signUserToken(user);
        setUserCookie(res, token);
        return res.status(200).json({ error: false, token });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};

const requestOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: true, msg: 'Email is required' });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: true, msg: 'User not found. Please register first.' });
        }

        if (user.blocked) {
            return res.status(403).json({ error: true, msg: 'Your account is blocked' });
        }

        const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        await Users.findByIdAndUpdate(user._id, {
            $set: {
                'loginOtp.token': otpHash,
                'loginOtp.expires': otpExpiry,
                'loginOtp.attempts': 0,
            },
        });

        const sent = await sendEmail({
            to: email,
            subject: 'Your One-Time Login Code',
            html: generateEmailTemplate(
                'Secure Login Code',
                'A request to sign in to your OneMoreGift account was made. Please use the following one-time password to proceed.',
                otpCode,
                '<p>This code will expire in <b>5 minutes</b>. Please do not share this code.</p>'
            )
        });

        if (!sent) {
            console.error(`Failed to send OTP email to ${email}`);
            return res.status(500).json({ error: true, msg: 'Failed to send OTP email due to server configuration' });
        }

        return res.status(200).json({ error: false, msg: 'OTP sent successfully' });
    } catch (error) {
        console.error('requestOtp Exception:', error);
        return res.status(500).json({ error: true, msg: 'Failed to request OTP: internal error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: true, msg: 'Email and OTP are required' });
        }

        const user = await Users.findOne({ email });
        if (!user || !user.loginOtp || !user.loginOtp.token) {
            return res.status(400).json({ error: true, msg: 'OTP is invalid or expired' });
        }

        if (Date.now() > new Date(user.loginOtp.expires).getTime()) {
            await Users.findByIdAndUpdate(user._id, { $unset: { loginOtp: '' } });
            return res.status(400).json({ error: true, msg: 'OTP is invalid or expired' });
        }

        const isOtpMatch = await bcrypt.compare(otp, user.loginOtp.token);
        if (!isOtpMatch) {
            const nextAttempts = (user.loginOtp.attempts || 0) + 1;
            if (nextAttempts >= 5) {
                await Users.findByIdAndUpdate(user._id, { $unset: { loginOtp: '' } });
                return res.status(429).json({ error: true, msg: 'Too many wrong attempts, request a new OTP' });
            }

            await Users.findByIdAndUpdate(user._id, { $set: { 'loginOtp.attempts': nextAttempts } });
            return res.status(400).json({ error: true, msg: 'Invalid OTP' });
        }

        const updateDoc = { $unset: { loginOtp: '' } };
        let firstVerification = false;
        if (user.isVerified === false) {
            updateDoc.$set = { isVerified: true };
            firstVerification = true;
        }
        await Users.findByIdAndUpdate(user._id, updateDoc);

        if (firstVerification) {
            await sendEmail({
                to: email,
                subject: 'Welcome to OneMoreGift!',
                html: generateEmailTemplate(
                    'Welcome Aboard!',
                    `Hello ${user.name}, welcome to OneMoreGift! We are thrilled to have you with us.`,
                    '',
                    '<p>Your account has been successfully verified. You can now start exploring and enjoy the best gifts!</p>'
                )
            }).catch(err => console.error('Welcome email failed:', err));
        }

        const token = signUserToken(user);
        setUserCookie(res, token);
        return res.status(200).json({ error: false, token });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Failed to verify OTP' });
    }
};

const googleSignin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: true, msg: 'Google credential is required' });
        }

        if (!googleClient) {
            return res.status(500).json({ error: true, msg: 'Google auth is not configured' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.email_verified) {
            return res.status(400).json({ error: true, msg: 'Invalid Google account' });
        }

        let user = await Users.findOne({ email: payload.email });

        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = await Users.create({
                name: payload.name || 'Google User',
                email: payload.email,
                phone: null,
                password: hashedPassword,
                googleId: payload.sub,
                isGoogleAuth: true,
                avatar: payload.picture || '',
                isVerified: true
            });

            await sendEmail({
                to: payload.email,
                subject: 'Welcome to OneMoreGift!',
                html: generateEmailTemplate(
                    'Welcome Aboard!',
                    `Hello ${user.name}, welcome to OneMoreGift! We are thrilled to have you with us.`,
                    '',
                    '<p>Your account has been successfully verified. You can now start exploring and enjoy the best gifts!</p>'
                )
            });
        } else {
            // Update Google metadata; also clear legacy fake phone values
            const updates = {};
            if (!user.googleId) {
                updates.googleId = payload.sub;
                updates.isGoogleAuth = true;
            }
            if (!user.isVerified) {
                updates.isVerified = true;
            }
            if (payload.picture && (!user.avatar || user.avatar !== payload.picture)) {
                updates.avatar = payload.picture;
            }
            // Clear old fake phone numbers stored as 'google_XXXXXXXXXX'
            if (user.phone && user.phone.startsWith('google_')) {
                updates.phone = null;
            }
            if (Object.keys(updates).length > 0) {
                await Users.findByIdAndUpdate(user._id, { $set: updates });
                user = { ...user.toObject(), ...updates };
            }
        }

        if (user.blocked) {
            return res.status(403).json({ error: true, msg: 'Your account is blocked' });
        }

        const token = signUserToken(user);
        setUserCookie(res, token);
        return res.status(200).json({ error: false, token });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Google Sign-In failed' });
    }
};

const resetPass = async (req, res) => {
    try {
        const { email, phoneNo } = req.body;

        if (!email && !phoneNo) {
            return res.status(400).json({ error: true, msg: 'Email or phone number is required.' });
        }

        if (email) {
            const findUser = await Users.findOne({ email });
            if (!findUser) {
                return res.status(200).json({ error: true, msg: 'Something went wrong..' });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = Date.now() + 60 * 60 * 1000;

            await Users.findByIdAndUpdate(findUser._id, {
                $set: {
                    'resetToken.token': resetToken,
                    'resetToken.expires': tokenExpiry,
                    'resetToken.attempts': 0,
                },
            });

            const resetLink = `${CLIENT_URL}/login/reset-pass?token=${resetToken}&email=${email}`;

            await sendEmail({
                to: email,
                subject: 'Password Reset Request',
                html: generateEmailTemplate(
                    'Reset Your Password',
                    'We received a request to retrieve access to your account. Click the secure link below to proceed with setting a new password.',
                    '',
                    `<a href="${resetLink}" class="link-btn">Reset My Password</a>
                    <p style="margin-top: 20px;">Or copy and paste this URL into your browser:<br/><span style="color:#ef4444; word-break: break-all; font-size: 13px;">${resetLink}</span></p>
                    <p>This link is only valid for 1 hour.</p>`
                )
            });

            return res.status(200).json({ error: false, msg: 'A password reset link has been sent to your email.' });
        }

        return res.status(400).json({ error: true, msg: 'Something went wrong.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, msg: 'An internal server error occurred.' });
    }
};

const setPass = async (req, res) => {
    try {
        const { email, token, password } = req.body;

        if (!token || !password || !email) {
            return res.status(400).json({ error: true, msg: 'Token, email, and password fields are required.' });
        }

        const user = await Users.findOne({ email });
        if (!user || !user.resetToken || !user.resetToken.token) {
            return res.status(400).json({ error: true, msg: 'Token is invalid or has expired. Please request a new password reset.' });
        }

        if (user.resetToken.token !== token || Date.now() > user.resetToken.expires) {
            return res.status(400).json({ error: true, msg: 'Token is invalid or has expired. Please request a new password reset.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Users.updateOne(
            { email },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: '' },
            }
        );

        await sendEmail({
            to: email,
            subject: 'Password Changed Successfully',
            html: generateEmailTemplate(
                'Password Updated',
                'Your OneMoreGift account password has been successfully changed.',
                '',
                '<p>If you did not perform this action, please contact support immediately to secure your account.</p>'
            )
        });

        return res.status(200).json({ error: false, msg: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error in setPass function:', error);
        return res.status(500).json({ error: true, msg: 'An internal server error occurred.' });
    }
};

const checkUser = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: true, msg: 'Phone no is required.' });
        }

        const findUser = await Users.findOne({ phone }).select('-_id blocked');
        if (findUser) {
            return res.status(200).json({ error: false, msg: 'User exists', user: findUser });
        }

        return res.status(404).json({ error: true, msg: 'User not exist' });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Something went wrong.' });
    }
};

const me = async (req, res) => {
    try {
        const userId = req.user?.data?._id;
        if (!userId) {
            return res.status(401).json({ error: true, msg: 'Unauthorized' });
        }

        const user = await Users.findById(userId).select('-password -resetToken -loginOtp');
        if (!user) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        return res.status(200).json({ error: false, user });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch session user' });
    }
};

const logout = async (req, res) => {
    clearUserCookie(res);
    return res.status(200).json({ error: false, msg: 'Logged out successfully' });
};

const verifyRegistrationOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: true, msg: 'Email and OTP are required' });
        }

        const user = await Users.findOne({ email });
        if (!user || user.isVerified || !user.loginOtp || !user.loginOtp.token) {
            return res.status(400).json({ error: true, msg: 'Invalid request or already verified' });
        }

        if (Date.now() > new Date(user.loginOtp.expires).getTime()) {
            await Users.findByIdAndUpdate(user._id, { $unset: { loginOtp: '' } });
            return res.status(400).json({ error: true, msg: 'OTP has expired' });
        }

        const isOtpMatch = await bcrypt.compare(otp, user.loginOtp.token);
        if (!isOtpMatch) {
            const nextAttempts = (user.loginOtp.attempts || 0) + 1;
            if (nextAttempts >= 5) {
                await Users.findByIdAndUpdate(user._id, { $unset: { loginOtp: '' } });
                return res.status(429).json({ error: true, msg: 'Too many wrong attempts, request a new OTP' });
            }

            await Users.findByIdAndUpdate(user._id, { $set: { 'loginOtp.attempts': nextAttempts } });
            return res.status(400).json({ error: true, msg: 'Invalid OTP' });
        }

        await Users.findByIdAndUpdate(user._id, {
            $set: { isVerified: true },
            $unset: { loginOtp: '' }
        });

        await sendEmail({
            to: email,
            subject: 'Welcome to OneMoreGift!',
            html: generateEmailTemplate(
                'Welcome Aboard!',
                `Hello ${user.name}, welcome to OneMoreGift! We are thrilled to have you with us.`,
                '',
                '<p>Your account has been successfully verified. You can now start exploring and enjoy the best gifts!</p>'
            )
        });

        const token = signUserToken(user);
        setUserCookie(res, token);
        return res.status(200).json({ error: false, token, msg: 'Account verified successfully' });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Failed to verify OTP' });
    }
};

module.exports = {
    register,
    login,
    resetPass,
    setPass,
    checkUser,
    requestOtp,
    verifyOtp,
    verifyRegistrationOtp,
    googleSignin,
    me,
    logout,
};
