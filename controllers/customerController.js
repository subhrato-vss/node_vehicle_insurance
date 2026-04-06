/**
 * customerController.js
 * Handles customer detail submission with full server-side validation.
 */
const Policy = require('../models/policyModel');

// ─── Validation Helpers ──────────────────────────────────
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}
function validatePincode(pincode) {
    return /^\d{6}$/.test(pincode);
}

const customerController = {

    /**
     * POST /api/save-customer-details
     * Validates + saves the full insurance application.
     */
    save: async (req, res) => {
        const { customer, vehicle, insurance } = req.body;

        // ─── Validate Customer Fields ────────────────────────
        const errors = [];

        if (!customer) {
            return res.status(400).json({ success: false, message: 'Customer details are required.' });
        }

        const { name, email, mobile, address1, address2, city, state, pincode } = customer;

        if (!name || name.trim().length < 2) errors.push({ field: 'name', message: 'Full name is required (min 2 characters).' });
        if (!email || !validateEmail(email)) errors.push({ field: 'email', message: 'Valid email address is required.' });
        if (!mobile || !validateMobile(mobile)) errors.push({ field: 'mobile', message: 'Valid 10-digit mobile number is required.' });
        if (!address1 || address1.trim().length < 5) errors.push({ field: 'address1', message: 'Address line 1 is required (min 5 characters).' });
        if (!city || city.trim().length < 2) errors.push({ field: 'city', message: 'City is required.' });
        if (!state || state.trim().length < 2) errors.push({ field: 'state', message: 'State is required.' });
        if (!pincode || !validatePincode(pincode)) errors.push({ field: 'pincode', message: 'Valid 6-digit pincode is required.' });

        // ─── Validate Vehicle / Insurance Fields ─────────────
        if (!vehicle || !vehicle.variant_id) errors.push({ field: 'vehicle', message: 'Vehicle details are missing.' });
        if (!insurance || !insurance.plan_id) errors.push({ field: 'plan', message: 'Insurance plan is missing.' });
        if (!insurance || !insurance.final_premium || insurance.final_premium <= 0) errors.push({ field: 'premium', message: 'Invalid premium amount.' });

        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors, message: errors[0].message });
        }

        try {
            // ─── Build Data for DB ───────────────────────────
            const policyData = {
                customer_name: name.trim(),
                customer_email: email.trim().toLowerCase(),
                customer_mobile: mobile.trim(),
                address_line1: address1.trim(),
                address_line2: address2 ? address2.trim() : null,
                customer_city: city.trim(),
                customer_state: state.trim(),
                customer_pincode: pincode.trim(),

                variant_id: vehicle.variant_id,
                vehicle_type: vehicle.type || 'car',
                manufacturing_year: vehicle.year,
                fuel_type: vehicle.fuel,
                rto_city: vehicle.city,
                previous_claim: vehicle.claim,

                base_premium: insurance.base_premium,
                idv: insurance.idv,
                plan_id: insurance.plan_id,
                plan_name: insurance.plan_name,
                plan_price: insurance.plan_price,
                addons: insurance.addons || [],
                addons_cost: insurance.addons_cost || 0,
                final_premium: insurance.final_premium
            };

            const policyId = await Policy.create(policyData);

            return res.json({
                success: true,
                message: 'Customer details saved successfully!',
                policyId
            });

        } catch (error) {
            console.error('Customer Save Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to save details. Please try again.'
            });
        }
    }
};

module.exports = customerController;
