const Claim = require('../models/claimModel');
const Policy = require('../models/policyModel');

const claimController = {
    /**
     * POST /api/claim/create
     * Handle claim submission with file uploads.
     */
    createClaim: async (req, res) => {
        const { policyId, claimReason, description, claimAmount } = req.body;
        const userId = req.customer?.id;

        if (!policyId || !claimReason || !claimAmount) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
        }

        try {
            // 1. Validate policy ownership and status (Final Table)
            const policy = await Policy.findFinalById(policyId);
            if (!policy || policy.user_id !== userId) {
                return res.status(403).json({ success: false, message: 'Unauthorized: Policy not found or does not belong to you.' });
            }
            if (policy.status !== 'active' && policy.status !== 'expiring') {
                return res.status(400).json({ success: false, message: 'Claims can only be raised for active policies.' });
            }

            // 2. Prevent multiple active claims
            const hasActive = await Claim.hasActiveClaim(policyId);
            if (hasActive) {
                return res.status(400).json({ success: false, message: 'An active claim already exists for this policy.' });
            }

            // 3. Validate claim amount (<= IDV)
            if (parseFloat(claimAmount) > parseFloat(policy.idv)) {
                return res.status(400).json({ success: false, message: `Claim amount cannot exceed the policy IDV of ₹${parseFloat(policy.idv).toLocaleString('en-IN')}` });
            }

            // 4. Create claim in database
            const claimId = await Claim.create({
                policyId,
                userId,
                claimReason,
                description,
                claimAmount
            });

            // 5. Save uploaded documents
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    // Document types are handled via the frontend field name if needed, but for now we store them all.
                    const docType = file.fieldname === 'rc_copy' ? 'RC Copy' : (file.fieldname === 'driving_license' ? 'Driving License' : 'Damage Photo');
                    await Claim.addDocument(claimId, `/uploads/claims/${file.filename}`, docType);
                }
            }

            res.json({ success: true, message: 'Claim submitted successfully. Our team will review it.', claimId });

        } catch (error) {
            console.error('Claim Creation Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error while raising claim.' });
        }
    },

    /**
     * GET /user/claims
     * Renders the user's claims page.
     */
    renderUserClaims: async (req, res) => {
        try {
            const userId = req.customer.id;
            const claims = await Claim.getByUser(userId);
            res.render('user-claims', { title: 'My Claims', claims, activeTab: 'claims' });
        } catch (error) {
            console.error('User Claims Render Error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    /**
     * GET /user/claim/new/:policyId
     * Renders the claim submission form.
     */
    renderClaimForm: async (req, res) => {
        try {
            const { policyId } = req.params;
            const userId = req.customer.id;
            
            const [rows] = await require('../config/db').query('SELECT * FROM policies WHERE id = ?', [policyId]);
            const policy = rows[0];

            if (!policy || policy.user_id !== userId) {
                return res.redirect('/user/dashboard');
            }

            res.render('claim-form', { title: 'Raise a Claim', policy, activeTab: 'dashboard' });
        } catch (error) {
            console.error('Claim Form Render Error:', error);
            res.redirect('/user/dashboard');
        }
    },

    /**
     * GET /admin/claims
     * Handles admin-side management view.
     */
    adminGetClaims: async (req, res) => {
        try {
            const statusFilter = req.query.status || null;
            const claims = await Claim.getAllDetailed(statusFilter);
            res.render('admin/claims', { 
                title: 'Claims Management', 
                claims, 
                activeTab: 'claims',
                currentFilter: statusFilter
            });
        } catch (error) {
            console.error('Admin Claims Fetch Error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    /**
     * POST /admin/claim/update-status
     * Admin approval or rejection logic.
     */
    updateStatus: async (req, res) => {
        const { claimId, status, rejectionReason } = req.body;
        if (!claimId || !status) {
            return res.status(400).json({ success: false, message: 'Invalid claim update request.' });
        }

        try {
            await Claim.updateStatus(claimId, status, rejectionReason);
            res.json({ success: true, message: `Claim status updated to ${status}.` });
        } catch (error) {
            console.error('Claim Status Update Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
};

module.exports = claimController;
