const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { signToken, verifyToken };
