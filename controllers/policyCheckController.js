/**
 * policyCheckController.js
 * Business logic for detecting duplicate policy purchases.
 */
const Policy = require('../models/policyModel');

const policyCheckController = {
    /**
     * POST /api/check-duplicate-policy
     * Request: { email, variant_id }
     */
    checkDuplicate: async (req, res) => {
        const { email, variant_id } = req.body;

        if (!email || !variant_id) {
            return res.status(400).json({ success: false, message: 'Email and variant ID are required.' });
        }

        try {
            const existingPolicy = await Policy.checkDuplicate(email, variant_id);

            if (existingPolicy) {
                // Calculate if expiring soon (within 30 days)
                const expiryDate = new Date(existingPolicy.end_date);
                const today = new Date();
                const isExpired = expiryDate < today;
                
                // Diff calculation
                const diffTime = expiryDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isExpiringSoon = !isExpired && diffDays <= 30;

                return res.json({
                    duplicate: true,
                    policyNumber: existingPolicy.policy_number,
                    expiryDate: existingPolicy.end_date,
                    id: existingPolicy.id,
                    status: existingPolicy.status,
                    isExpiringSoon,
                    isExpired
                });
            }

            return res.json({ duplicate: false });

        } catch (error) {
            console.error('Duplicate Policy Check Error:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
};

module.exports = policyCheckController;
