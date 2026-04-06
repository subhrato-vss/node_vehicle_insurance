const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const brandController = require('../controllers/brandController');
const modelController = require('../controllers/modelController');
const variantController = require('../controllers/variantController');
const policyController = require('../controllers/policyController');
const authMiddleware = require('../middleware/authMiddleware');

// Auth
router.get('/login', authController.getLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

const db = require('../config/db');

// Dashboard (Protected)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Basic vehicle stats
    const [[brandCount]] = await db.query('SELECT COUNT(*) as count FROM brands');
    const [[modelCount]] = await db.query('SELECT COUNT(*) as count FROM models');
    const [[variantCount]] = await db.query('SELECT COUNT(*) as count FROM variants');
    
    // Policy stats
    const [[policyCount]] = await db.query('SELECT COUNT(*) as count FROM policies');
    const [[activePolicyCount]] = await db.query("SELECT COUNT(*) as count FROM policies WHERE status = 'active'");
    const [[totalRevenue]] = await db.query('SELECT SUM(final_premium) as total FROM policies');
    
    // Fetch 5 recent variants
    const [recentVariants] = await db.query(`
      SELECT v.name, v.id, m.name as model_name, b.name as brand_name, b.type as brand_type
      FROM variants v
      JOIN models m ON v.model_id = m.id
      JOIN brands b ON m.brand_id = b.id
      ORDER BY v.id DESC LIMIT 5
    `);

    // Fetch 5 recent policies
    const [recentPolicies] = await db.query(`
      SELECT p.policy_number, p.customer_name, p.final_premium, p.created_at, p.status,
             v.name as variant_name, b.name as brand_name
      FROM policies p
      LEFT JOIN variants v ON p.variant_id = v.id
      LEFT JOIN models m ON v.model_id = m.id
      LEFT JOIN brands b ON m.brand_id = b.id
      ORDER BY p.created_at DESC LIMIT 5
    `);

    res.render('admin/dashboard', { 
      title: 'Admin Dashboard',
      stats: {
        brands: brandCount.count,
        models: modelCount.count,
        variants: variantCount.count,
        policies: policyCount.count,
        activePolicies: activePolicyCount.count,
        revenue: totalRevenue.total || 0
      },
      recentVariants,
      recentPolicies,
      activeTab: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard', 
      stats: { brands: 0, models: 0, variants: 0, policies: 0, activePolicies: 0, revenue: 0 }, 
      recentVariants: [],
      recentPolicies: [],
      activeTab: 'dashboard'
    });
  }
});

// Brands CRUD
router.get('/brands', authMiddleware, brandController.getAll);
router.post('/brands', authMiddleware, brandController.create);
router.put('/brands/:id', authMiddleware, brandController.update);
router.delete('/brands/:id', authMiddleware, brandController.delete);

// Models CRUD
router.get('/models', authMiddleware, modelController.getAll);
router.post('/models', authMiddleware, modelController.create);
router.put('/models/:id', authMiddleware, modelController.update);
router.delete('/models/:id', authMiddleware, modelController.delete);

// Variants CRUD
router.get('/variants', authMiddleware, variantController.getAll);
router.post('/variants', authMiddleware, variantController.create);
router.put('/variants/:id', authMiddleware, variantController.update);
router.delete('/variants/:id', authMiddleware, variantController.delete);

// Policies (Admin)
router.get('/policies', authMiddleware, policyController.adminGetAll);

// Change Password
router.get('/change-password', authMiddleware, authController.getChangePassword);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;

