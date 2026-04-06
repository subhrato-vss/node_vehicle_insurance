const db = require('../config/db');

const Model = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT m.*, b.name as brand_name, b.type as brand_type
      FROM models m
      JOIN brands b ON m.brand_id = b.id
      ORDER BY m.id DESC
    `);
    return rows;
  },

  getByBrandId: async (brandId) => {
    const [rows] = await db.execute('SELECT * FROM models WHERE brand_id = ?', [brandId]);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT m.*, b.name as brand_name, b.type as brand_type
      FROM models m
      JOIN brands b ON m.brand_id = b.id
      WHERE m.id = ?
    `, [id]);
    return rows[0];
  },

  create: async (brandId, name) => {
    const [result] = await db.execute('INSERT INTO models (brand_id, name) VALUES (?, ?)', [brandId, name]);
    return result.insertId;
  },

  update: async (id, brandId, name) => {
    const [result] = await db.execute('UPDATE models SET brand_id = ?, name = ? WHERE id = ?', [brandId, name, id]);
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM models WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Model;
