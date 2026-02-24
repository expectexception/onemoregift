const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const { register, login, resetPass, setPass, checkUser, requestOtp, verifyOtp, verifyRegistrationOtp, googleSignin, me, logout } = require('../controller/authController');
router.post('/login', login);
router.post('/register', register);
router.post('/reset-pass', resetPass);
router.post('/set-pass', setPass);
router.post('/check-user', checkUser);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/verify-registration-otp', verifyRegistrationOtp);
router.post('/google-signin', googleSignin);
router.get('/me', isAuth, me);
router.post('/logout', logout);

module.exports = router;