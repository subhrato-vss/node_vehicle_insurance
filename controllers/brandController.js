const Brand = require('../models/brandModel');

const brandController = {
  getAll: async (req, res) => {
    const { type } = req.query;
    try {
      const allBrands = await Brand.getAll(null);
      const counts = {
        all: allBrands.length,
        car: allBrands.filter(b => b.type === 'car').length,
        bike: allBrands.filter(b => b.type === 'bike').length
      };
      
      let brands = allBrands;
      if (type && type !== 'all') {
        brands = allBrands.filter(b => b.type === type);
      }
      res.render('admin/brands', { brands, counts, title: 'Manage Brands', currentType: type || 'all', activeTab: 'brands' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },

  create: async (req, res) => {
    const { name, type } = req.body;
    try {
      if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type are required' });
      const id = await Brand.create(name, type);
      return res.json({ success: true, message: 'Brand created successfully', id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error creating brand' });
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;
    try {
      await Brand.update(id, name, type);
      return res.json({ success: true, message: 'Brand updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error updating brand' });
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const Model = require('../models/modelModel');
      const associatedModels = await Model.getByBrandId(id);
      
      if (associatedModels.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete brand. It has associated models or variants.' 
        });
      }

      await Brand.delete(id);
      return res.json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error deleting brand' });
    }
  },

  // Public API
  apiGetBrands: async (req, res) => {
    const { type } = req.query;
    try {
      const allBrands = await Brand.getAll(null);
      const counts = {
        all: allBrands.length,
        car: allBrands.filter(b => b.type === 'car').length,
        bike: allBrands.filter(b => b.type === 'bike').length
      };

      let brands = allBrands;
      if (type && type !== 'all') {
        brands = allBrands.filter(b => b.type === type);
      }
      res.json({ brands, counts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

module.exports = brandController;
