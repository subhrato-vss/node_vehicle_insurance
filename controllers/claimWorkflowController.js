const Claim = require('../models/claimModel');

const claimWorkflowController = {
    /**
     * POST /api/admin/claim/advance-stage
     * Move from Stage 1 (Submitted) to Stage 2 (Under Review).
     */
    moveToReview: async (req, res) => {
        const { claimId } = req.body;
        if (!claimId) return res.status(400).json({ success: false, message: 'Claim ID required.' });

        try {
            const claim = await Claim.getById(claimId);
            if (!claim || claim.status !== 'submitted') {
                return res.status(400).json({ success: false, message: 'Claim must be in "Submitted" status to move to Review.' });
            }

            await Claim.updateStatus(claimId, 'under_review', 2);
            res.json({ success: true, message: 'Claim moved to "Under Review" status.' });
        } catch (error) {
            console.error('Workflow Error (Review):', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    /**
     * POST /api/admin/claim/verify-docs
     * Mark documents as verified and move to Stage 3 (Docs Verified).
     */
    verifyDocuments: async (req, res) => {
        const { claimId, verifications } = req.body; // verifications: [{ docId, isVerified, notes }]
        if (!claimId || !verifications) return res.status(400).json({ success: false, message: 'Invalid verification data.' });

        try {
            const claim = await Claim.getById(claimId);
            if (!claim || claim.status !== 'under_review') {
                return res.status(400).json({ success: false, message: 'Claim must be "Under Review" to verify documents.' });
            }

            // Update each document
            for (const v of verifications) {
                await Claim.verifyDocument(v.docId, v.isVerified, v.notes);
            }

            // Check if all docs are now verified
            const updatedClaim = await Claim.getById(claimId);
            const allVerified = updatedClaim.documents.every(d => d.is_verified === 1);

            if (allVerified) {
                await Claim.updateStatus(claimId, 'docs_verified', 3);
                return res.json({ success: true, message: 'All documents verified. Stage 3 reached.' });
            } else {
                return res.json({ success: true, message: 'Documents updated, but some remain unverified.' });
            }
        } catch (error) {
            console.error('Workflow Error (Verify):', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    /**
     * POST /api/admin/claim/approve-payout
     * Calculate payout (90%) and move to Stage 4 (Approved).
     */
    approveClaim: async (req, res) => {
        const { claimId } = req.body;
        if (!claimId) return res.status(400).json({ success: false, message: 'Claim ID required.' });

        try {
            const claim = await Claim.getById(claimId);
            if (!claim || claim.status !== 'docs_verified') {
                return res.status(400).json({ success: false, message: 'Documents must be fully verified before approval.' });
            }

            const payoutAmount = parseFloat(claim.claim_amount) * 0.90;
            await Claim.approveWithPayout(claimId, payoutAmount);
            
            res.json({ success: true, message: `Claim approved. Payout of ₹${payoutAmount.toLocaleString('en-IN')} scheduled.`, payoutAmount });
        } catch (error) {
            console.error('Workflow Error (Approve):', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    /**
     * POST /api/admin/claim/process-payout
     * Final Stage 5 (Paid).
     */
    processPayout: async (req, res) => {
        const { claimId } = req.body;
        if (!claimId) return res.status(400).json({ success: false, message: 'Claim ID required.' });

        try {
            const claim = await Claim.getById(claimId);
            if (!claim || claim.status !== 'approved') {
                return res.status(400).json({ success: false, message: 'Claim must be "Approved" to process payout.' });
            }

            await Claim.markAsPaid(claimId);
            res.json({ success: true, message: 'Payout processed. Claim status updated to "Paid".' });
        } catch (error) {
            console.error('Workflow Error (Payout):', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = claimWorkflowController;
