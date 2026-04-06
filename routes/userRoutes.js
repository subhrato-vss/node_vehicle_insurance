/**
 * userRoutes.js
 * Routing for User login, registration, and dashboard access.
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const renewalController = require('../controllers/renewalController');
const userAuthMiddleware = require('../middleware/userAuthMiddleware');

// ─── API Routes ──────────────────────────────────────────────
router.post('/api/user/send-otp', userController.sendOtp);
router.post('/api/user/verify-otp', userController.verifyOtp);
router.post('/api/user/logout', userController.logout);
router.get('/api/user/policies', userAuthMiddleware, userController.getUserPolicies);
router.post('/api/user/change-password', userAuthMiddleware, userController.changePassword);
router.get('/api/policies/history/:id', userAuthMiddleware, renewalController.getPolicyHistory);

// ─── View Routes ─────────────────────────────────────────────
router.get('/user/login', (req, res) => {
    // If already logged in, redirect
    if (req.cookies && req.cookies.user_token) {
        return res.redirect('/user/dashboard');
    }
    res.render('otp-login', { title: 'Customer OTP Login' });
});

router.get('/user/dashboard', userAuthMiddleware, userController.renderDashboard);
router.get('/user/profile', userAuthMiddleware, userController.renderProfile);
router.get('/user/change-password', userAuthMiddleware, userController.getChangePassword);
router.get('/user/policy/:id', userAuthMiddleware, userController.renderPolicyInfo);

// Renewal Flow
router.get('/renew-policy/:id', userAuthMiddleware, renewalController.renderRenewForm);

module.exports = router;
