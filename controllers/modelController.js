const Model = require('../models/modelModel');
const Brand = require('../models/brandModel');

const modelController = {
  getAll: async (req, res) => {
    try {
      const allModels = await Model.getAll();
      const counts = {
        all: allModels.length,
        car: allModels.filter(m => m.brand_type === 'car').length,
        bike: allModels.filter(m => m.brand_type === 'bike').length
      };

      const type = req.query.type;
      let models = allModels;
      if (type && type !== 'all') {
        models = allModels.filter(m => m.brand_type === type);
      }

      if (req.query.json) return res.json({ models, counts });
      
      const brands = await Brand.getAll();
      res.render('admin/models', { models, counts, brands, currentType: type || 'all', title: 'Manage Models', activeTab: 'models' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },

  create: async (req, res) => {
    const { brand_id, name } = req.body;
    try {
      if (!brand_id || !name) return res.status(400).json({ success: false, message: 'Brand and name are required' });
      await Model.create(brand_id, name);
      return res.json({ success: true, message: 'Model created successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error creating model' });
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { brand_id, name } = req.body;
    try {
      await Model.update(id, brand_id, name);
      return res.json({ success: true, message: 'Model updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error updating model' });
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const Variant = require('../models/variantModel');
      const associatedVariants = await Variant.getByModelId(id);

      if (associatedVariants.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete model. It has associated variants.' 
        });
      }

      await Model.delete(id);
      return res.json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error deleting model' });
    }
  },

  // Public API
  apiGetModels: async (req, res) => {
    const { brand_id } = req.query;
    try {
      if (!brand_id) return res.status(400).json({ error: 'Brand ID is required' });
      const models = await Model.getByBrandId(brand_id);
      res.json(models);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

module.exports = modelController;
