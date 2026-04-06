const db = require('../config/db');

const Variant = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT v.*, m.name as model_name, b.id as brand_id, b.name as brand_name, b.type as brand_type
      FROM variants v
      JOIN models m ON v.model_id = m.id
      JOIN brands b ON m.brand_id = b.id
      ORDER BY v.id DESC
    `);
    return rows;
  },

  getByModelId: async (modelId) => {
    const [rows] = await db.execute('SELECT * FROM variants WHERE model_id = ?', [modelId]);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT v.*, m.name as model_name, b.name as brand_name, b.type as brand_type
      FROM variants v
      JOIN models m ON v.model_id = m.id
      JOIN brands b ON m.brand_id = b.id
      WHERE v.id = ?
    `, [id]);
    return rows[0];
  },

  create: async (modelId, name, basePrice = 500000) => {
    const [result] = await db.execute(
      'INSERT INTO variants (model_id, name, base_price) VALUES (?, ?, ?)',
      [modelId, name, basePrice]
    );
    return result.insertId;
  },

  update: async (id, modelId, name, basePrice) => {
    const [result] = await db.execute(
      'UPDATE variants SET model_id = ?, name = ?, base_price = ? WHERE id = ?',
      [modelId, name, basePrice, id]
    );
    return result.affectedRows;
  },

  getWithPrice: async (id) => {
    const [rows] = await db.execute(`
      SELECT v.id, v.name, v.base_price, v.model_id,
             m.name as model_name, b.id as brand_id, b.name as brand_name, b.type as brand_type
      FROM variants v
      JOIN models m ON v.model_id = m.id
      JOIN brands b ON m.brand_id = b.id
      WHERE v.id = ?
    `, [id]);
    return rows[0];
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM variants WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Variant;
