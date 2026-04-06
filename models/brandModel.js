const db = require('../config/db');

const Brand = {
  getAll: async (type) => {
    let query = 'SELECT * FROM brands';
    let params = [];
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM brands WHERE id = ?', [id]);
    return rows[0];
  },

  create: async (name, type) => {
    const [result] = await db.execute('INSERT INTO brands (name, type) VALUES (?, ?)', [name, type]);
    return result.insertId;
  },

  update: async (id, name, type) => {
    const [result] = await db.execute('UPDATE brands SET name = ?, type = ? WHERE id = ?', [name, type, id]);
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM brands WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Brand;
