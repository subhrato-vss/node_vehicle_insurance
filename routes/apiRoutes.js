const express = require('express');
const router = express.Router();
const vehicleFormController = require('../controllers/vehicleFormController');
const premiumController = require('../controllers/premiumController');
const customerController = require('../controllers/customerController');
const paymentController = require('../controllers/paymentController');
const policyController = require('../controllers/policyController');
const policyCheckController = require('../controllers/policyCheckController');

// ─── Public Form APIs (separate from admin) ──────────────
router.get('/form/brands', vehicleFormController.getBrands);
router.get('/form/models', vehicleFormController.getModels);
router.get('/form/variants', vehicleFormController.getVariants);

// Duplicate Policy Check (Business Logic)
router.post('/check-duplicate-policy', policyCheckController.checkDuplicate);

// Vehicle Details Submission (AJAX)
router.post('/form/submit', vehicleFormController.submitVehicleDetails);

// ─── Premium Calculation API ─────────────────────────────
router.post('/calculate-premium', premiumController.calculate);

// ─── Plan Selection API ──────────────────────────────────
router.post('/get-plans', premiumController.getPlans);

// ─── Customer Details API ────────────────────────────────
router.post('/save-customer-details', customerController.save);

// ─── Payment APIs ────────────────────────────────────────
router.post('/payment/create-order', paymentController.createOrder);
router.post('/payment/verify', paymentController.verify);
router.post('/payment/dummy', paymentController.dummy);

// ─── Policy Generation API ───────────────────────────────
router.post('/generate-policy', policyController.generatePolicy);

module.exports = router;
