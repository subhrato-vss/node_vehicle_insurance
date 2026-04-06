const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel');
const { signToken } = require('../utils/jwtUtils');
const db = require('../config/db');

const authController = {
  getLogin: (req, res) => {
    res.render('admin/login', { error: null, title: 'Admin Login' });
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = await Admin.findByEmail(email);
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = signToken({ id: admin.id, email: admin.email });
      res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
      return res.json({ success: true, message: 'Login successful' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  logout: (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
  },

  getChangePassword: (req, res) => {
    res.render('admin/change-password', { title: 'Change Password', activeTab: 'none' });
  },

  changePassword: async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    try {
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
      }

      // Fetch admin with password
      const admin = await Admin.findByEmail(req.user.email);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin account not found' });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash new password and update
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await db.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);

      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change Password Error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = authController;

