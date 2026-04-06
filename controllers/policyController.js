/**
 * policyController.js
 * Handles policy generation, PDF creation, and finalization.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Policy = require('../models/policyModel');

const policyController = {

    /**
     * POST /api/generate-policy
     * Generates policy number, moves data to final table, and generates PDF.
     */
    generatePolicy: async (req, res) => {
        const { policyId } = req.body;

        if (!policyId) {
            return res.status(400).json({ success: false, message: 'Policy ID is required.' });
        }

        try {
            // 1. Fetch temp policy and validate payment status
            const tempPolicy = await Policy.findById(policyId);
            if (!tempPolicy) {
                return res.status(404).json({ success: false, message: 'Temporary policy not found.' });
            }

            if (tempPolicy.status !== 'paid') {
                return res.status(400).json({ success: false, message: 'Policy is not paid yet. Cannot generate.' });
            }

            // 2. Generate unique policy number (POL + Year + 4 digit increment)
            const year = new Date().getFullYear();
            const lastId = await Policy.getLastFinalPolicyId();
            const nextId = lastId + 1;
            const policyNumber = `POL${year}${String(nextId).padStart(4, '0')}`;

            // 3. Move data to final table
            await Policy.moveToFinal(policyId, policyNumber);

            // 4. Generate PDF with NEW naming convention
            const finalPolicy = await Policy.getDetailedPolicy(policyNumber);
            const pdfFilename = `POLICY_${policyNumber}.pdf`;
            const pdfPath = path.join(__dirname, '..', 'public', 'policies', pdfFilename);

            const pdfGenerator = require('../utils/pdfGenerator');
            await pdfGenerator.generatePolicyPDF(finalPolicy, pdfPath);

            // 4.1 Auto-create/link User Account
            const User = require('../models/userModel');
            const db = require('../config/db');
            let linkedUser = await User.findByEmail(finalPolicy.customer_email);
            if (!linkedUser) {
                const insertId = await User.create(
                    finalPolicy.customer_name,
                    finalPolicy.customer_email,
                    finalPolicy.customer_mobile,
                    null
                );
                linkedUser = { id: insertId };
            }
            await db.query('UPDATE policies SET user_id = ? WHERE id = ?', [linkedUser.id, finalPolicy.id]);

            // 5. Send Professional Policy Success Email (Instead of OTP)
            const sendPolicySuccessEmail = require('../utils/sendPolicyEmail');
            await sendPolicySuccessEmail(finalPolicy.customer_email, {
                policyNumber: policyNumber,
                customerName: finalPolicy.customer_name,
                planName: finalPolicy.plan_name,
                vehicleDetails: `${finalPolicy.brand_name} ${finalPolicy.model_name} — ${finalPolicy.variant_name}`,
                finalPremium: finalPolicy.final_premium,
                endDate: finalPolicy.end_date
            });

            // 6. Return success
            return res.json({
                success: true,
                policyNumber: policyNumber,
                email: finalPolicy.customer_email 
            });

        } catch (error) {
            console.error('Policy Generation Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate policy. Please contact support.'
            });
        }
    },

    /**
     * GET /admin/policies
     * Lists all finalized policies for admin.
     */
    adminGetAll: async (req, res) => {
        try {
            const policies = await Policy.getAllFinalDetailed();
            res.render('admin/policies', { 
                title: 'Manage Policies', 
                policies, 
                activeTab: 'policies' 
            });
        } catch (error) {
            console.error('Admin Policies Error:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};



module.exports = policyController;
