/**
 * renewalController.js
 * Handles endpoints related to reviewing and tracking policy renewals.
 */
const Policy = require('../models/policyModel');
const db = require('../config/db');

const renewalController = {
    renderRenewForm: async (req, res) => {
        try {
            const { id } = req.params;
            const email = req.customer.email;

            const [rows] = await db.query('SELECT * FROM policies WHERE id = ? AND customer_email = ?', [id, email]);
            const policy = rows[0];

            if (!policy) {
                return res.status(404).render('home', { title: 'Not Found', message: 'Policy not found or unauthorized' });
            }

            // Verify it is expiring or expired
            const today = new Date();
            let canRenew = false;
            if (policy.status === 'expired') {
                canRenew = true;
            } else if (policy.status === 'active' && policy.end_date) {
                const diffTime = new Date(policy.end_date) - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 15) canRenew = true;
            }

            if (!canRenew) {
                return res.status(400).render('home', { title: 'Not Eligible', message: 'This policy is not eligible for renewal yet.' });
            }

            let parsedAddons = [];
            try { parsedAddons = typeof policy.addons === 'string' ? JSON.parse(policy.addons) : policy.addons; } catch(e){}
            policy.addonsArr = parsedAddons;

            res.render('renew-policy', { 
                title: 'Renew Policy', 
                policy,
                razorpayKey: process.env.RAZORPAY_KEY_ID || ''
            });

        } catch (error) {
            console.error('Render Renew Form Error:', error);
            res.redirect('/user/dashboard');
        }
    },

    getPolicyHistory: async (req, res) => {
        try {
            const { id } = req.params;
            const lineage = await Policy.getPolicyHistory(id);
            res.json(lineage);
        } catch (e) {
            console.error('History Fetch Error:', e);
            res.status(500).json({ error: 'Failed to retrieve history' });
        }
    }
};

module.exports = renewalController;
