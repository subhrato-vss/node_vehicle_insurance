/**
 * userController.js
 * Auth logic and user dashboard data delivery.
 */
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwtUtils');
const User = require('../models/userModel');
const Policy = require('../models/policyModel');
const db = require('../config/db');

const userController = {
    sendOtp: async (req, res) => {
        let { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        email = email.trim().toLowerCase();

        try {
            // 1. Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // 2. Validate user or Create if doesn't exist
            let user = await User.findByEmail(email);
            if (!user) {
                // Auto create shell account for OTP flow if not originating from checkout
                const insertId = await User.create(email.split('@')[0], email, '0000000000', null);
                user = await User.findById(insertId);
            }

            // 3. Purge old OTPs for this email
            await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

            // 4. Insert new OTP
            const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes
            await db.query(
                `INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)`,
                [email, otp, expiresAt]
            );

            // 5. Dispatch email
            const sendOtpEmail = require('../utils/sendOtp');
            const sent = await sendOtpEmail(email, otp);
            if (!sent) {
                return res.status(500).json({ success: false, message: 'Failed to dispatch email' });
            }

            res.json({ success: true, message: 'OTP sent to your email.' });

        } catch (e) {
            console.error('Send OTP Error:', e);
            res.status(500).json({ success: false, message: 'Server error while sending OTP.' });
        }
    },

    verifyOtp: async (req, res) => {
        let { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        email = email.trim().toLowerCase();

        try {
            // 1. Find valid OTP
            const [rows] = await db.query(
                `SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
                [email, otp]
            );

            if (rows.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
            }

            // 2. Clear OTP on success
            await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

            // 3. Mark user as verified
            await db.query('UPDATE users SET is_verified = TRUE WHERE email = ?', [email]);
            
            const user = await User.findByEmail(email);
            if (!user) return res.status(400).json({ success: false, message: 'User matching failed.' });

            // 4. Issue JWT
            const token = signToken({ id: user.id, email: user.email, role: 'customer' });
            res.cookie('user_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });

            res.json({ success: true, message: 'Login successful!', redirect: '/user/dashboard' });

        } catch (e) {
            console.error('Verify OTP Error:', e);
            res.status(500).json({ success: false, message: 'Server error while verifying OTP.' });
        }
    },

    logout: (req, res) => {
        res.clearCookie('user_token');
        res.redirect('/user/login');
    },

    getUserPolicies: async (req, res) => {
        try {
            const email = req.customer.email;
            const policies = await User.getUserPolicies(email);

            const today = new Date();
            
            // Re-map for the frontend needs
            const mapped = policies.map(p => {
                let currentStatus = p.status || 'active';
                
                if (currentStatus === 'active' && p.end_date) {
                    const diffTime = new Date(p.end_date) - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 0) currentStatus = 'expired';
                    else if (diffDays <= 15) currentStatus = 'expiring';
                }

                return {
                    id: p.id,
                    policy_number: p.policy_number,
                    vehicle: `${p.vehicle_type === 'car' ? 'Car' : 'Bike'} - ${p.manufacturing_year}`,
                    plan: p.plan_name,
                    premium: p.final_premium,
                    created_at: p.created_at,
                    start_date: p.start_date,
                    end_date: p.end_date,
                    status: currentStatus,
                    pdf: `/policies/POLICY_${p.policy_number}.pdf`
                };
            });

            res.json(mapped);
        } catch (e) {
            console.error('Fetch Policies Error:', e);
            res.status(500).json({ error: 'Failed to retrieve policies' });
        }
    },

    // Rendering functions
    renderDashboard: async (req, res) => {
        try {
            const user = await User.findById(req.customer.id);
            res.render('user-dashboard', { title: 'User Dashboard', user, activeTab: 'dashboard' });
        } catch (e) {
            res.redirect('/user/login');
        }
    },
    
    renderProfile: async (req, res) => {
        try {
            const user = await User.findById(req.customer.id);
            res.render('user-profile', { title: 'My Profile', user, activeTab: 'profile' });
        } catch (e) {
            console.error('Profile Render Error:', e);
            res.redirect('/user/login');
        }
    },

    getChangePassword: async (req, res) => {
        try {
            const user = await User.findById(req.customer.id);
            res.render('user-change-password', { title: 'Change Password', user, activeTab: 'change-password' });
        } catch (e) {
            res.redirect('/user/login');
        }
    },

    changePassword: async (req, res) => {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        try {
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'New passwords do not match' });
            }

            const user = await User.findById(req.customer.id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            if (user.password) {
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await User.updatePassword(user.id, hashedPassword);

            res.json({ success: true, message: 'Password updated successfully!' });
        } catch (e) {
            console.error('Customer Change Password Error:', e);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    renderPolicyInfo: async (req, res) => {
        try {
            const reqNumber = req.params.id;
            const email = req.customer.email;

            const policy = await Policy.getFinalPolicyByNumber(reqNumber);

            if (!policy || policy.customer_email !== email) {
                return res.status(404).render('home', { title: 'Not Found', message: 'Policy not found or unauthorized' });
            }

            let parsedAddons = [];
            try { parsedAddons = typeof policy.addons === 'string' ? JSON.parse(policy.addons) : policy.addons; } catch(e){}

            const user = await User.findById(req.customer.id);

            res.render('user-policy-details', { title: `Policy Details - ${policy.policy_number}`, policy, addons: parsedAddons, user });
        } catch (e) {
            console.error('Policy Details Render Error:', e);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = userController;
