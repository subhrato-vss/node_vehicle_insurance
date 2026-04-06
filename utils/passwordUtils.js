const bcrypt = require('bcryptjs');

/**
 * Hash a plain text password
 * @param {string} password - The raw password string
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(String(password), salt);
};

/**
 * Compare a plain text password with a hash
 * @param {string} password - The raw password string
 * @param {string} hash - The hashed password
 * @returns {Promise<boolean>} - True if match, false otherwise
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(String(password), hash);
};

module.exports = {
  hashPassword,
  comparePassword
};
