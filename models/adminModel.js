const db = require('../config/db');

const Admin = {
  findByEmail: async (email) => {
    const [rows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute('SELECT id, email FROM admins WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = Admin;
