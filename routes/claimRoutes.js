const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const upload = require('../utils/upload');
const { verifyToken } = require('../utils/jwtUtils');

const authMiddleware = require('../middleware/authMiddleware');

/**
 * Middleware: Verify standard user login.
 */
const userAuth = (req, res, next) => {
    const token = req.cookies.user_token;
    if (!token) return res.redirect('/user/login');
    try {
        const decoded = verifyToken(token);
        req.customer = decoded;
        next();
    } catch (e) {
        res.clearCookie('user_token');
        res.redirect('/user/login');
    }
};

const claimWorkflowController = require('../controllers/claimWorkflowController');

/**
 * User Routes
 */
router.get('/user/claims', userAuth, claimController.renderUserClaims);
router.get('/user/claim/new/:policyId', userAuth, claimController.renderClaimForm);
router.post('/api/claim/create', userAuth, upload.any(), claimController.createClaim);

/**
 * Admin Routes
 */
router.get('/admin/claims', authMiddleware, claimController.adminGetClaims);
router.post('/api/admin/claim/update-status', authMiddleware, claimController.updateStatus);

// NEW Workflow Routes
router.post('/api/admin/claim/move-to-review', authMiddleware, claimWorkflowController.moveToReview);
router.post('/api/admin/claim/verify-docs', authMiddleware, claimWorkflowController.verifyDocuments);
router.post('/api/admin/claim/approve-payout', authMiddleware, claimWorkflowController.approveClaim);
router.post('/api/admin/claim/process-payout', authMiddleware, claimWorkflowController.processPayout);

module.exports = router;
