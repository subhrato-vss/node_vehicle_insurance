const Variant = require('../models/variantModel');
const Model = require('../models/modelModel');
const Brand = require('../models/brandModel');

const variantController = {
  getAll: async (req, res) => {
    try {
      const allVariants = await Variant.getAll();
      const counts = {
        all: allVariants.length,
        car: allVariants.filter(v => v.brand_type === 'car').length,
        bike: allVariants.filter(v => v.brand_type === 'bike').length
      };

      const type = req.query.type;
      let variants = allVariants;
      if (type && type !== 'all') {
        variants = allVariants.filter(v => v.brand_type === type);
      }

      if (req.query.json) return res.json({ variants, counts });
      
      const models = await Model.getAll();
      const brands = await Brand.getAll();
      res.render('admin/variants', { variants, counts, models, brands, currentType: type || 'all', title: 'Manage Variants', activeTab: 'variants' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },

  create: async (req, res) => {
    const { model_id, name, base_price } = req.body;
    try {
      if (!model_id || !name) return res.status(400).json({ success: false, message: 'Model and name are required' });
      await Variant.create(model_id, name, base_price || 500000);
      return res.json({ success: true, message: 'Variant created successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error creating variant' });
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { model_id, name, base_price } = req.body;
    try {
      await Variant.update(id, model_id, name, base_price || 500000);
      return res.json({ success: true, message: 'Variant updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error updating variant' });
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;
    try {
      await Variant.delete(id);
      return res.json({ success: true, message: 'Variant deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error deleting variant' });
    }
  },

  // Public API
  apiGetVariants: async (req, res) => {
    const { model_id } = req.query;
    try {
      if (!model_id) return res.status(400).json({ error: 'Model ID is required' });
      const variants = await Variant.getByModelId(model_id);
      res.json(variants);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

module.exports = variantController;
