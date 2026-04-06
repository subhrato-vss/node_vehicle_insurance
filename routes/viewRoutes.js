const express = require('express');
const router = express.Router();
const Policy = require('../models/policyModel');

// Landing page
router.get('/', (req, res) => {
  res.render('landing', { title: 'DriveGuard Insurance' });
});

// Vehicle selection form
router.get('/vehicle-form', (req, res) => {
  const { type } = req.query;
  if (!['car', 'bike'].includes(type)) {
    return res.redirect('/');
  }
  res.render('vehicle-form', { 
    type, 
    title: `Select Your ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    razorpayKey: process.env.RAZORPAY_KEY_ID || ''
  });
});

// Confirmation page
router.get('/policy-success', async (req, res) => {
  const { id, email } = req.query;
  if (!id) return res.redirect('/');
  
  try {
    const policy = await Policy.getDetailedPolicy(id);
    if (!policy) return res.redirect('/');
    
    res.render('policy-success', { 
      title: 'Payment Successful', 
      policy,
      email: email || policy.customer_email
    });
  } catch (error) {
    console.error('Error fetching policy details:', error);
    res.redirect('/');
  }
});

module.exports = router;
