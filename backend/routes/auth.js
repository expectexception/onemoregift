const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const isAuth = require('../middleware/isAuth');
const { register, login, resetPass, setPass, checkUser, requestOtp, verifyOtp, verifyRegistrationOtp, googleSignin, me, logout } = require('../controller/authController');

const skipInTests = () => process.env.NODE_ENV === 'test';
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
});
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
});

router.post('/login', authLimiter, login);
router.post('/register', emailLimiter, register);
router.post('/reset-pass', emailLimiter, resetPass);
router.post('/set-pass', authLimiter, setPass);
router.post('/check-user', authLimiter, checkUser);
router.post('/request-otp', emailLimiter, requestOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/verify-registration-otp', authLimiter, verifyRegistrationOtp);
router.post('/google-signin', authLimiter, googleSignin);
router.get('/me', isAuth, me);
router.post('/logout', logout);

module.exports = router;
