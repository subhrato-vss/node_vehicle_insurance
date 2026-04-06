const db = require('../config/db');

const User = {
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },
    updatePassword: async (userId, hashedPassword) => {
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        return result.affectedRows > 0;
    },
    create: async (name, email, mobile, hashedPassword) => {
        const [result] = await db.query(
            'INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)',
            [name, email, mobile, hashedPassword]
        );
        return result.insertId;
    },
    getUserPolicies: async (email) => {
        // Fetch matching finalized policies based on the customer email 
        const [rows] = await db.query('SELECT * FROM policies WHERE customer_email = ? ORDER BY created_at DESC', [email]);
        return rows;
    }
};

module.exports = User;
