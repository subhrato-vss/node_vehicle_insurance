/**
 * premiumController.js
 * Modular premium calculation engine.
 * Calculates insurance premium based on IDV, vehicle age, fuel, city risk, and claim history.
 */
const Variant = require('../models/variantModel');

// ─── Factor Definitions ──────────────────────────────────
const FUEL_FACTORS = {
    petrol:   1.00,
    diesel:   1.02,
    electric: 0.95
};

const HIGH_RISK_CITIES = [
    'delhi', 'mumbai', 'bengaluru', 'chennai', 'kolkata',
    'hyderabad', 'pune', 'ahmedabad', 'gurgaon', 'noida',
    'thane', 'navi mumbai', 'ghaziabad', 'faridabad'
];

const CITY_FACTOR_HIGH   = 1.10;
const CITY_FACTOR_NORMAL = 1.00;

const CLAIM_FACTOR_YES = 1.20;
const CLAIM_FACTOR_NO  = 1.00;

const DEPRECIATION_RATE_PER_YEAR = 0.05;
const MAX_DEPRECIATION = 0.70; // Cap at 70% max depreciation
const PREMIUM_BASE_RATE = 0.04; // Increased from 3% to 4% as requested
const MAX_PLAN_PRICE_CAP = 450000; // Hard cap at 4.5 Lac as requested

// ─── Helper: Calculate Premium ───────────────────────────
function calculatePremium({ basePrice, year, fuel, city, claim }) {
    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(0, currentYear - parseInt(year));

    // Age depreciation (capped)
    const ageDepreciation = Math.min(vehicleAge * DEPRECIATION_RATE_PER_YEAR, MAX_DEPRECIATION);

    // Fuel factor
    const fuelFactor = FUEL_FACTORS[fuel] || 1.00;

    // City risk factor
    const cityNormalized = (city || '').toLowerCase().trim();
    const cityFactor = HIGH_RISK_CITIES.includes(cityNormalized) ? CITY_FACTOR_HIGH : CITY_FACTOR_NORMAL;

    // Claim history factor
    const claimFactor = claim === 'yes' ? CLAIM_FACTOR_YES : CLAIM_FACTOR_NO;

    // IDV after depreciation (Capped at 4.5 Lac)
    let depreciatedValue = basePrice - (basePrice * ageDepreciation);
    depreciatedValue = Math.min(depreciatedValue, MAX_PLAN_PRICE_CAP);
    
    // Final premium (3% base + factors)
    let rawPremium = (depreciatedValue * PREMIUM_BASE_RATE) * fuelFactor * cityFactor * claimFactor;
    
    // SCALE DOWN: If premium exceeds 3L, scale down by 50% as requested for simulation
    if (rawPremium > 300000) {
        rawPremium = rawPremium * 0.5;
    }

    const premium = Math.min(Math.round(rawPremium * 100) / 100, MAX_PLAN_PRICE_CAP);
    const idv = Math.round(depreciatedValue * 100) / 100;

    // Breakdown for display
    const breakdown = {
        basePrice: basePrice,
        age: {
            years: vehicleAge,
            rate: `-${Math.round(ageDepreciation * 100)}%`,
            impact: -Math.round(basePrice * ageDepreciation)
        },
        fuel: {
            type: fuel,
            factor: fuelFactor === 1 ? 'Standard' : (fuelFactor > 1 ? `+${Math.round((fuelFactor - 1) * 100)}%` : `-${Math.round((1 - fuelFactor) * 100)}%`),
            impact: fuelFactor
        },
        city: {
            name: city,
            isHighRisk: HIGH_RISK_CITIES.includes(cityNormalized),
            factor: cityFactor === 1 ? 'Standard' : `+${Math.round((cityFactor - 1) * 100)}%`,
            impact: cityFactor
        },
        claim: {
            hasClaim: claim === 'yes',
            factor: claim === 'yes' ? `+${Math.round((CLAIM_FACTOR_YES - 1) * 100)}%` : 'No surcharge',
            impact: claim === 'yes' ? CLAIM_FACTOR_YES : CLAIM_FACTOR_NO
        }
    };

    return { premium, idv, breakdown };
}

// ─── Controller ──────────────────────────────────────────
const premiumController = {

    /**
     * POST /api/calculate-premium
     * Request: { variant_id, year, fuel, city, claim }
     * Response: { success, premium, idv, breakdown, vehicleInfo }
     */
    calculate: async (req, res) => {
        const { variant_id, year, fuel, city, claim } = req.body;

        // Validate required fields
        if (!variant_id || !year || !fuel || !city || !claim) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: variant_id, year, fuel, city, claim'
            });
        }

        try {
            // Fetch variant with base price from DB
            const variant = await Variant.getWithPrice(variant_id);

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle variant not found'
                });
            }

            const basePrice = parseFloat(variant.base_price) || 500000;

            // Calculate premium
            const result = calculatePremium({
                basePrice,
                year,
                fuel,
                city,
                claim
            });

            return res.json({
                success: true,
                premium: result.premium,
                idv: result.idv,
                breakdown: result.breakdown,
                vehicleInfo: {
                    brand: variant.brand_name,
                    model: variant.model_name,
                    variant: variant.name,
                    type: variant.brand_type
                }
            });

        } catch (error) {
            console.error('Premium Calculation Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to calculate premium. Please try again.'
            });
        }
    },

    /**
     * POST /api/get-plans
     * Request: { premium, idv }
     * Response: { plans: [...] }
     * Generates 3 insurance plans based on the calculated base premium.
     */
    getPlans: (req, res) => {
        const { premium, idv, type } = req.body;
        const basePremium = parseFloat(premium) || 0;
        const vehicleIdv = parseFloat(idv) || 0;
        const vehicleType = type || 'car'; 

        // Multipliers based on vehicle type
        const standardMult = (vehicleType === 'car') ? 1.25 : 1.20;
        const premiumMult  = (vehicleType === 'car') ? 1.50 : 1.40;

        const plans = [
            {
                id: 'basic',
                name: 'Basic',
                tagline: 'Essential Protection',
                price: Math.min(Math.round(basePremium), MAX_PLAN_PRICE_CAP),
                multiplier: 1.0,
                icon: 'fas fa-shield-alt',
                color: 'blue',
                recommended: false,
                features: [
                    { text: 'Third-Party Liability Cover', included: true },
                    { text: 'Personal Accident Cover', included: true },
                    { text: 'Legal Liability to Paid Driver', included: true },
                    { text: 'Own Damage Cover', included: false },
                    { text: 'Zero Depreciation', included: false },
                    { text: 'Roadside Assistance', included: false },
                    { text: 'Engine Protection', included: false },
                    { text: 'Consumables Cover', included: false }
                ]
            },
            {
                id: 'standard',
                name: 'Standard',
                tagline: 'Comprehensive Coverage',
                price: Math.min(Math.round(basePremium * standardMult), MAX_PLAN_PRICE_CAP),
                multiplier: standardMult,
                icon: 'fas fa-car-crash',
                color: 'indigo',
                recommended: true,
                features: [
                    { text: 'Third-Party Liability Cover', included: true },
                    { text: 'Personal Accident Cover', included: true },
                    { text: 'Legal Liability to Paid Driver', included: true },
                    { text: 'Own Damage Cover', included: true },
                    { text: 'Zero Depreciation', included: true },
                    { text: 'Roadside Assistance', included: true },
                    { text: 'Engine Protection', included: false },
                    { text: 'Consumables Cover', included: false }
                ]
            },
            {
                id: 'premium',
                name: 'Premium',
                tagline: 'Maximum Protection',
                price: Math.min(Math.round(basePremium * premiumMult), MAX_PLAN_PRICE_CAP),
                multiplier: premiumMult,
                icon: 'fas fa-gem',
                color: 'violet',
                recommended: false,
                features: [
                    { text: 'Third-Party Liability Cover', included: true },
                    { text: 'Personal Accident Cover', included: true },
                    { text: 'Legal Liability to Paid Driver', included: true },
                    { text: 'Own Damage Cover', included: true },
                    { text: 'Zero Depreciation', included: true },
                    { text: 'Roadside Assistance', included: true },
                    { text: 'Engine Protection', included: true },
                    { text: 'Consumables Cover', included: true }
                ]
            }
        ];

        return res.json({
            success: true,
            plans,
            basePremium: Math.round(basePremium),
            idv: Math.round(vehicleIdv)
        });
    }
};

module.exports = premiumController;
