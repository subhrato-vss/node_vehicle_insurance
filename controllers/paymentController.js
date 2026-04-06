/**
 * paymentController.js
 * Handles dummy payment, Razorpay order creation, and payment verification.
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Policy = require('../models/policyModel');

// ─── Razorpay Instance (Test Mode) ──────────────────────
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

const paymentController = {

    /**
     * POST /api/payment/create-order
     * Creates a Razorpay order for the given policyId.
     */
    createOrder: async (req, res) => {
        const { policyId } = req.body;

        if (!policyId) {
            return res.status(400).json({ success: false, message: 'Policy ID is required.' });
        }

        try {
            const policy = await Policy.findById(policyId);
            if (!policy) {
                return res.status(404).json({ success: false, message: 'Policy not found.' });
            }

            if (policy.status === 'paid') {
                return res.status(400).json({ success: false, message: 'Policy is already paid.' });
            }

            const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
            const originalAmount = parseFloat(policy.final_premium);
            const payableAmount = isDev ? Math.min(originalAmount, 5000) : originalAmount;
            const amountInPaise = Math.round(payableAmount * 100);

            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_policy_${policyId}`,
                notes: {
                    policyId: String(policyId),
                    customerName: policy.customer_name,
                    planName: policy.plan_name,
                    actualAmount: String(originalAmount)
                }
            };

            const order = await razorpayInstance.orders.create(options);

            // Save order_id and tracked amounts to DB
            await Policy.updatePayment(policyId, { 
                order_id: order.id,
                paid_amount: payableAmount,
                actual_amount: originalAmount
            });

            return res.json({
                success: true,
                orderId: order.id,
                amount: order.amount,
                payableAmount: payableAmount,
                actualAmount: originalAmount,
                isTestMode: isDev && originalAmount > 5000,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                customerName: policy.customer_name,
                customerEmail: policy.customer_email,
                customerMobile: policy.customer_mobile
            });

        } catch (error) {
            console.error('Razorpay Order Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment order. Please try again.'
            });
        }
    },

    /**
     * POST /api/payment/verify
     * Verifies Razorpay payment signature.
     */
    verify: async (req, res) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, policyId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !policyId) {
            return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
        }

        try {
            // Verify signature
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
                .update(body)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                // Mark as failed
                await Policy.updatePayment(policyId, {
                    payment_id: razorpay_payment_id,
                    payment_method: 'razorpay_failed',
                    status: 'pending'
                });

                return res.status(400).json({
                    success: false,
                    message: 'Payment verification failed. Signature mismatch.'
                });
            }

            // Success — update DB
            await Policy.updatePayment(policyId, {
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                payment_method: 'razorpay',
                status: 'paid'
            });

            return res.json({
                success: true,
                message: 'Payment verified successfully!',
                policyId,
                paymentId: razorpay_payment_id
            });

        } catch (error) {
            console.error('Payment Verify Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Payment verification failed. Please contact support.'
            });
        }
    },

    /**
     * POST /api/payment/dummy
     * Simulates payment for testing.
     */
    dummy: async (req, res) => {
        const { policyId, action } = req.body;

        if (!policyId || !action) {
            return res.status(400).json({ success: false, message: 'Policy ID and action are required.' });
        }

        try {
            const policy = await Policy.findById(policyId);
            if (!policy) {
                return res.status(404).json({ success: false, message: 'Policy not found.' });
            }

            if (action === 'success') {
                await Policy.updatePayment(policyId, {
                    payment_id: `dummy_pay_${Date.now()}`,
                    order_id: `dummy_order_${policyId}`,
                    payment_method: 'simulation',
                    paid_amount: policy.final_premium, // Simulation counts as full payment for demo
                    actual_amount: policy.final_premium,
                    status: 'paid'
                });

                return res.json({
                    success: true,
                    message: 'Payment simulated successfully! (Success)',
                    policyId,
                    paymentId: `dummy_pay_${Date.now()}`
                });
            } else {
                return res.json({
                    success: false,
                    message: 'Payment failed. Please try again. (Test Mode)'
                });
            }

        } catch (error) {
            console.error('Dummy Payment Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Payment processing error.'
            });
        }
    }
};

module.exports = paymentController;
