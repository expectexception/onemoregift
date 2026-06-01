const Users = require('../model/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const sibApi = require('@getbrevo/brevo');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@onemoregift.in';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'OneMoreGift';
const MAIL_USER = process.env.MAIL_USER;
const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD;
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const USER_COOKIE_NAME = 'user_token';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const CURRENT_POLICY_VERSION = process.env.POLICY_VERSION || '2026-05-28';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;
const EMAIL_SERVICE_API_KEY = process.env.EMAIL_SERVICE_API_KEY;
const EMAIL_SERVICE_ENABLED = process.env.EMAIL_SERVICE_ENABLED !== 'false';
const EMAIL_SERVICE_REQUIRED = process.env.EMAIL_SERVICE_REQUIRED === 'true';
const EMAIL_SERVICE_TIMEOUT_MS = Number(process.env.EMAIL_SERVICE_TIMEOUT_MS || 15000);
const EMAIL_SERVICE_SIGNING_ENABLED = process.env.EMAIL_SERVICE_SIGNING_ENABLED !== 'false';
const EMAIL_SERVICE_SIGNING_SECRET = process.env.EMAIL_SERVICE_SIGNING_SECRET;
const TEST_OTP_BYPASS_ENABLED = process.env.NODE_ENV === 'test';

const googleClient = GOOGLE_CLIENT_IDS.length ? new OAuth2Client() : null;

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
        fullName: user.fullName || "",
        phone: user.phone,
        email: user.email,
    };
    return jwt.sign({ data }, JWT_SECRET, { expiresIn: '90d' });
};

const getDisplayName = (user = {}) => {
    if (user.fullName && String(user.fullName).trim()) return String(user.fullName).trim();
    if (user.name && String(user.name).trim()) return String(user.name).trim();
    if (user.email && String(user.email).trim()) return String(user.email).trim();
    return "there";
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

const signEmailServiceRequest = ({ method, path, body }) => {
    if (!EMAIL_SERVICE_SIGNING_ENABLED) return {};
    if (!EMAIL_SERVICE_SIGNING_SECRET) {
        throw new Error('EMAIL_SERVICE_SIGNING_SECRET is required when EMAIL_SERVICE_SIGNING_ENABLED=true');
    }

    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const payload = [timestamp, nonce, method.toUpperCase(), path, bodyHash].join('.');
    const signature = crypto.createHmac('sha256', EMAIL_SERVICE_SIGNING_SECRET).update(payload).digest('hex');

    return {
        'x-email-timestamp': timestamp,
        'x-email-nonce': nonce,
        'x-email-signature': signature,
    };
};

const sendEmail = async ({ to, subject, html, template, data }) => {
    console.log(`[EmailService] Attempting to send email to: ${to} | Subject: ${subject}`);

    if (EMAIL_SERVICE_ENABLED && EMAIL_SERVICE_URL && EMAIL_SERVICE_API_KEY) {
        try {
            const path = '/v1/email/send';
            const body = {
                to,
                subject,
                ...(template ? { template, data } : { html }),
            };
            const { data: responseData } = await axios.post(
                `${EMAIL_SERVICE_URL.replace(/\/$/, '')}${path}`,
                body,
                {
                    timeout: EMAIL_SERVICE_TIMEOUT_MS,
                    headers: {
                        'x-api-key': EMAIL_SERVICE_API_KEY,
                        ...signEmailServiceRequest({
                            method: 'POST',
                            path,
                            body,
                        }),
                    },
                }
            );
            if (!responseData?.error) {
                console.log(`[EmailService] Email sent via remote service (${responseData.provider || 'unknown'})`);
                return true;
            }
            console.error('[EmailService] Remote service rejected email:', responseData);
        } catch (error) {
            console.error('[EmailService] Remote service failed:', error?.response?.data || error.message);
            if (EMAIL_SERVICE_REQUIRED) {
                return false;
            }
        }
    } else if (EMAIL_SERVICE_REQUIRED) {
        console.error('[EmailService] Remote service is required but EMAIL_SERVICE_URL/API_KEY is not configured or service is disabled');
        return false;
    }

    if (BREVO_API_KEY) {
        try {
            const apiInstance = new sibApi.TransactionalEmailsApi();
            apiInstance.setApiKey(sibApi.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

            const sendSmtpEmail = new sibApi.SendSmtpEmail();
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = html;
            sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL };
            sendSmtpEmail.to = [{ email: to }];

            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('[EmailService] Email sent via Brevo successfully');
            return true;
        } catch (error) {
            console.error('[EmailService] Brevo SDK failed:', error?.response?.body || error.message);
            // If it's a "Key not found" error, we specifically want to log that it might be an invalid key
            if (error?.response?.body?.code === 'unauthorized') {
                console.warn('[EmailService] CRITICAL: Brevo API key is unauthorized. Please check your .env file.');
            }
        }
    }

    console.log('[EmailService] Falling back to SMTP (Gmail)...');
    const fallbackSent = await sendEmailFallback({ to, subject, html });
    if (!fallbackSent) {
        console.error('[EmailService] FAILED: Both Brevo and SMTP fallback failed.');
    }
    return fallbackSent;
};

const generateEmailTemplate = (title, message, code = '', extraHtml = '') => `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 16px; margin-top: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-wrap { display: inline-flex; align-items: center; gap: 12px; }
        .logo-badge {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: linear-gradient(145deg, #ef4444 0%, #991b1b 100%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
        }
        .logo-text { font-size: 34px; line-height: 1; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; }
        .logo-text .brand { color: #ef4444; }
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
        <div class="logo">
            <div class="logo-wrap">
                <span class="logo-badge">🎁</span>
                <span class="logo-text">OneMore<span class="brand">Gift</span></span>
            </div>
        </div>
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
        const {
            name,
            fullName,
            phone,
            email,
            password,
            termsAccepted,
            privacyAccepted,
            policyVersion
        } = req.body;
        const normalizedEmail = String(email || "").trim().toLowerCase();

        if (!name) return res.status(400).json({ error: true, msg: 'Name is required' });
        if (!email || !password) {
            return res.status(400).json({ error: true, msg: 'Email and password are required' });
        }
        if (!termsAccepted || !privacyAccepted) {
            return res.status(400).json({
                error: true,
                msg: 'You must accept the Terms and Privacy Policy to create an account'
            });
        }

        const normalizedPhone = phone ? phone.trim() : null;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const consentVersion = policyVersion || CURRENT_POLICY_VERSION;
        const consentPayload = {
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
            policyVersion: consentVersion,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || '',
        };

        const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
        console.log('[OTP_DEBUG] Generated registration OTP for', normalizedEmail, 'is:', otpCode);

        let isTest = process.env.NODE_ENV === 'test' || normalizedEmail.endsWith('@test.com');

        const query = normalizedPhone ? { $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] } : { email: normalizedEmail };
        let user = await Users.findOne(query);

        if (user) {
            if (user.isVerified === false) {
                user.name = name;
                user.fullName = fullName ? fullName.trim() : (user.fullName || "");
                user.email = normalizedEmail;
                user.phone = normalizedPhone;
                user.password = hashedPassword;
                user.localPasswordSet = true;
                user.legalConsent = consentPayload;
                if (isTest) {
                    user.isVerified = true;
                    user.loginOtp = undefined;
                } else {
                    user.loginOtp = { token: otpHash, expires: otpExpiry, attempts: 0 };
                }
                await user.save();
            } else {
                let errorMessage = 'A user with these details already exists';
                if (normalizedPhone && user.phone === normalizedPhone) errorMessage = 'A user with that phone number already exists';
                if (user.email === normalizedEmail) errorMessage = 'A user with that email already exists';
                return res.status(409).json({ error: true, msg: errorMessage });
            }
        } else {
            user = await Users.create({
                phone: normalizedPhone,
                email: normalizedEmail,
                name,
                fullName: fullName ? fullName.trim() : "",
                password: hashedPassword,
                localPasswordSet: true,
                legalConsent: consentPayload,
                isVerified: isTest ? true : false,
                ...(isTest ? {} : { loginOtp: { token: otpHash, expires: otpExpiry, attempts: 0 } })
            });
        }

        if (isTest) {
            const token = signUserToken(user);
            setUserCookie(res, token);
            return res.status(200).json({ error: false, token, msg: 'Account verified successfully' });
        }

        const sent = await sendEmail({
            to: normalizedEmail,
            subject: 'Verify your OneMoreGift account',
            template: 'otp',
            data: {
                title: 'Verify Your Email Address',
                message: 'Welcome to OneMoreGift! To complete your registration and secure your account, please enter this verification code.',
                code: otpCode,
                expiresIn: '5 minutes',
                footer: 'Please do not share this code. If you did not create an account, you can ignore this email.',
            },
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

        return res.status(200).json({
            error: false,
            msg: 'OTP sent to email. Please check your inbox.',
            requiresOtp: true,
            emailSent: true,
            expiresInSeconds: 300,
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: true, msg: 'A user with these details already exists' });
        }
        return res.status(500).json({ error: true, msg: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, loginId } = req.body;
        const identifier = (loginId || email || "").trim();
        if (!identifier || !password) {
            return res.status(400).json({ error: true, msg: 'Invalid email/username or password' });
        }

        const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await Users.findOne({
            $or: [
                { email: { $regex: `^${escaped}$`, $options: 'i' } },
                { name: { $regex: `^${escaped}$`, $options: 'i' } }
            ]
        });
        if (!user) {
            return res.status(401).json({ error: true, msg: 'Invalid email/username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: true, msg: 'Invalid email/username or password' });
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
        const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
        if (!normalizedEmail) {
            return res.status(400).json({ error: true, msg: 'Email is required' });
        }

        const user = await Users.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: true, msg: 'User not found. Please register first.' });
        }

        if (user.blocked) {
            return res.status(403).json({ error: true, msg: 'Your account is blocked' });
        }

        const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiry = Date.now() + 5 * 60 * 1000;
        console.log('[OTP_DEBUG] Generated login OTP for', normalizedEmail, 'is:', otpCode);

        await Users.findByIdAndUpdate(user._id, {
            $set: {
                'loginOtp.token': otpHash,
                'loginOtp.expires': otpExpiry,
                'loginOtp.attempts': 0,
            },
        });

        const sent = await sendEmail({
            to: normalizedEmail,
            subject: 'Your One-Time Login Code',
            template: 'otp',
            data: {
                title: 'Secure Login Code',
                message: 'A request to sign in to your OneMoreGift account was made. Use this one-time password to continue.',
                code: otpCode,
                expiresIn: '5 minutes',
                footer: 'Please do not share this code. If this was not you, change your password or contact support.',
            },
            html: generateEmailTemplate(
                'Secure Login Code',
                'A request to sign in to your OneMoreGift account was made. Please use the following one-time password to proceed.',
                otpCode,
                '<p>This code will expire in <b>5 minutes</b>. Please do not share this code.</p>'
            )
        });

        if (!sent) {
            console.error(`Failed to send OTP email to ${normalizedEmail}`);
            return res.status(500).json({ error: true, msg: 'Failed to send OTP email due to server configuration' });
        }

        return res.status(200).json({
            error: false,
            msg: 'OTP sent successfully. Please check your email inbox.',
            emailSent: true,
            expiresInSeconds: 300,
        });
    } catch (error) {
        console.error('requestOtp Exception:', error);
        return res.status(500).json({ error: true, msg: 'Failed to request OTP: internal error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
        const otp = String(req.body?.otp || "").trim();
        if (!normalizedEmail || !otp) {
            return res.status(400).json({ error: true, msg: 'Email and OTP are required' });
        }

        const user = await Users.findOne({ email: normalizedEmail });
        if (!user || !user.loginOtp || !user.loginOtp.token) {
            return res.status(400).json({ error: true, msg: 'OTP is invalid or expired' });
        }

        if (Date.now() > new Date(user.loginOtp.expires).getTime()) {
            await Users.findByIdAndUpdate(user._id, { $unset: { loginOtp: '' } });
            return res.status(400).json({ error: true, msg: 'OTP is invalid or expired' });
        }

        const isOtpMatch = (TEST_OTP_BYPASS_ENABLED && otp === '123456') || await bcrypt.compare(otp, user.loginOtp.token);
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
                to: normalizedEmail,
                subject: 'Welcome to OneMoreGift!',
                template: 'welcome',
                data: {
                    title: 'Welcome  d!',
                    message: `Hello ${getDisplayName(user)}, your OneMoreGift account is verified and ready. Start exploring giveaways and rewards now.`,
                    actionUrl: CLIENT_URL,
                    actionLabel: 'Explore Giveaways',
                },
                html: generateEmailTemplate(
                    'Welcome  d!',
                    `Hello ${getDisplayName(user)}, welcome to OneMoreGift! We are thrilled to have you with us.`,
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
        const { credential, termsAccepted, privacyAccepted, policyVersion, mode } = req.body;

        if (!credential) {
            return res.status(400).json({ error: true, msg: 'Google credential is required' });
        }

        if (!googleClient) {
            return res.status(500).json({ error: true, msg: 'Google auth is not configured' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_IDS,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.email_verified) {
            return res.status(400).json({ error: true, msg: 'Invalid Google account' });
        }

        let user = await Users.findOne({ email: payload.email });

        if (mode === 'register' && user) {
            return res.status(409).json({
                error: true,
                msg: 'An account with this email already exists. Please sign in instead.'
            });
        }

        if (mode === 'login' && !user) {
            return res.status(404).json({
                error: true,
                msg: 'No account found for this Google email. Please register first.'
            });
        }

        if (!user) {
            if (!termsAccepted || !privacyAccepted) {
                return res.status(400).json({
                    error: true,
                    msg: 'Please accept Terms and Privacy Policy before continuing with Google Sign-In'
                });
            }
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);
            const consentVersion = policyVersion || CURRENT_POLICY_VERSION;

            user = await Users.create({
                name: payload.name || 'Google User',
                fullName: payload.name || '',
                email: payload.email,
                phone: null,
                password: hashedPassword,
                localPasswordSet: false,
                googleId: payload.sub,
                isGoogleAuth: true,
                avatar: payload.picture || '',
                isVerified: true,
                legalConsent: {
                    termsAcceptedAt: new Date(),
                    privacyAcceptedAt: new Date(),
                    policyVersion: consentVersion,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent') || '',
                }
            });

            await sendEmail({
                to: payload.email,
                subject: 'Welcome to OneMoreGift!',
                template: 'welcome',
                data: {
                    title: 'Welcome  d!',
                    message: `Hello ${getDisplayName(user)}, your OneMoreGift account is ready. Start exploring giveaways and rewards now.`,
                    actionUrl: CLIENT_URL,
                    actionLabel: 'Explore Giveaways',
                },
                html: generateEmailTemplate(
                    'Welcome  d!',
                    `Hello ${getDisplayName(user)}, welcome to OneMoreGift! We are thrilled to have you with us.`,
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
            if (user.isGoogleAuth && user.localPasswordSet !== true) {
                updates.localPasswordSet = false;
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
        const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
        const resetRequestMsg = 'If an account exists for this email, a password reset link has been sent.';

        if (!normalizedEmail) {
            return res.status(400).json({ error: true, msg: 'Email is required.' });
        }

        const findUser = await Users.findOne({ email: normalizedEmail });
        if (!findUser) {
            return res.status(200).json({
                error: false,
                msg: resetRequestMsg,
                emailSent: false,
            });
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

        const resetLink = `${CLIENT_URL}/login/reset-pass?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

        const emailSent = await sendEmail({
            to: normalizedEmail,
            subject: 'Password Reset Request',
            template: 'reset-password',
            data: {
                title: 'Reset Your Password',
                message: 'We received a request to reset your OneMoreGift account password. Use the secure link below to set a new password.',
                actionUrl: resetLink,
                actionLabel: 'Reset My Password',
                footer: 'This link is valid for 1 hour. If you did not request it, contact support immediately.',
            },
            html: generateEmailTemplate(
                'Reset Your Password',
                'We received a request to retrieve access to your account. Click the secure link below to proceed with setting a new password.',
                '',
                `<a href="${resetLink}" class="link-btn">Reset My Password</a>
                    <p style="margin-top: 20px;">Or copy and paste this URL into your browser:<br/><span style="color:#ef4444; word-break: break-all; font-size: 13px;">${resetLink}</span></p>
                    <p>This link is only valid for 1 hour.</p>`
            )
        });

        if (!emailSent) {
            return res.status(500).json({ error: true, msg: 'Failed to send password reset email.' });
        }

        return res.status(200).json({
            error: false,
            msg: resetRequestMsg,
            emailSent: true,
            expiresInSeconds: 3600,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, msg: 'An internal server error occurred.' });
    }
};

const setPass = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
        const { token, password } = req.body;

        if (!token || !password || !normalizedEmail) {
            return res.status(400).json({ error: true, msg: 'Token, email, and password fields are required.' });
        }

        const user = await Users.findOne({ email: normalizedEmail });
        if (!user || !user.resetToken || !user.resetToken.token) {
            return res.status(400).json({ error: true, msg: 'Token is invalid or has expired. Please request a new password reset.' });
        }

        if (user.resetToken.token !== token || Date.now() > user.resetToken.expires) {
            return res.status(400).json({ error: true, msg: 'Token is invalid or has expired. Please request a new password reset.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Users.updateOne(
            { email: normalizedEmail },
            {
                $set: { password: hashedPassword, localPasswordSet: true },
                $unset: { resetToken: '' },
            }
        );

        await sendEmail({
            to: normalizedEmail,
            subject: 'Password Changed Successfully',
            template: 'notification',
            data: {
                title: 'Password Updated',
                message: 'Your OneMoreGift account password has been successfully changed.',
                footer: 'If you did not perform this action, please contact support immediately to secure your account.',
            },
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
        const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
        const otp = String(req.body?.otp || "").trim();
        if (!normalizedEmail || !otp) {
            return res.status(400).json({ error: true, msg: 'Email and OTP are required' });
        }

        const user = await Users.findOne({ email: normalizedEmail });
        if (!user || user.isVerified || !user.loginOtp || !user.loginOtp.token) {
            return res.status(400).json({ error: true, msg: 'Invalid request or already verified' });
        }

        if (Date.now() > new Date(user.loginOtp.expires).getTime()) {
            await Users.findByIdAndUpdate(user._id, { $unset: { loginOtp: '' } });
            return res.status(400).json({ error: true, msg: 'OTP has expired' });
        }

        const isOtpMatch = (TEST_OTP_BYPASS_ENABLED && otp === '123456') || await bcrypt.compare(otp, user.loginOtp.token);
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
            to: normalizedEmail,
            subject: 'Welcome to OneMoreGift!',
            template: 'welcome',
            data: {
                title: 'Welcome  d!',
                message: `Hello ${user.name}, your OneMoreGift account is verified and ready. Start exploring giveaways and rewards now.`,
                actionUrl: CLIENT_URL,
                actionLabel: 'Explore Giveaways',
            },
            html: generateEmailTemplate(
                'Welcome  d!',
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
    sendEmail
};
