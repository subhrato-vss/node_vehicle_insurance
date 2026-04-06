/**
 * vehicleFormController.js
 * Dedicated public APIs for the vehicle insurance form.
 * These are separate from admin CRUD controllers.
 */
const Brand = require('../models/brandModel');
const Model = require('../models/modelModel');
const Variant = require('../models/variantModel');

const vehicleFormController = {

    /**
     * GET /api/form/brands?type=car&q=hyundai
     * Returns a flat array of { id, name } for Tom Select.
     * Supports optional search query filtering.
     */
    getBrands: async (req, res) => {
        const { type, q } = req.query;
        try {
            let brands = await Brand.getAll(type || null);

            // Filter by search query if provided
            if (q && q.trim()) {
                const query = q.trim().toLowerCase();
                brands = brands.filter(b => b.name.toLowerCase().includes(query));
            }

            // Return flat array with only id + name (what Tom Select needs)
            res.json(brands.map(b => ({ id: b.id, name: b.name })));
        } catch (error) {
            console.error('Form API - getBrands error:', error);
            res.status(500).json({ error: 'Failed to fetch brands' });
        }
    },

    /**
     * GET /api/form/models?brand_id=5
     * Returns a flat array of { id, name } for the model dropdown.
     */
    getModels: async (req, res) => {
        const { brand_id } = req.query;
        try {
            if (!brand_id) {
                return res.status(400).json({ error: 'brand_id is required' });
            }
            const models = await Model.getByBrandId(brand_id);
            res.json(models.map(m => ({ id: m.id, name: m.name })));
        } catch (error) {
            console.error('Form API - getModels error:', error);
            res.status(500).json({ error: 'Failed to fetch models' });
        }
    },

    /**
     * GET /api/form/variants?model_id=12
     * Returns a flat array of { id, name } for the variant dropdown.
     */
    getVariants: async (req, res) => {
        const { model_id } = req.query;
        try {
            if (!model_id) {
                return res.status(400).json({ error: 'model_id is required' });
            }
            const variants = await Variant.getByModelId(model_id);
            res.json(variants.map(v => ({ id: v.id, name: v.name })));
        } catch (error) {
            console.error('Form API - getVariants error:', error);
            res.status(500).json({ error: 'Failed to fetch variants' });
        }
    },

    /**
     * POST /api/form/submit
     * Handles final stepper form submission.
     */
    submitVehicleDetails: (req, res) => {
        const { brand, model, variant, year, fuel, city, claim, vehicleType } = req.body;

        if (!brand || !model || !variant || !year || !fuel || !city || !claim || !vehicleType) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required. Please complete the form.'
            });
        }

        // In production, save to database here
        console.log('Vehicle Details Submitted:', req.body);

        return res.json({
            success: true,
            message: 'Vehicle details submitted successfully!',
            data: { brand, model, variant, year, fuel, city, claim, vehicleType }
        });
    }
};

module.exports = vehicleFormController;
