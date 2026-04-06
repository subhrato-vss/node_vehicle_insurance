const db = require('../config/db');

const Claim = {
    /**
     * Create a new claim.
     */
    create: async (data) => {
        const sql = `INSERT INTO claims 
            (policy_id, user_id, claim_reason, description, claim_amount, status) 
            VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            data.policyId,
            data.userId,
            data.claimReason,
            data.description,
            data.claimAmount,
            'submitted'
        ]);
        return result.insertId;
    },

    /**
     * Add a document to a claim.
     */
    addDocument: async (claimId, filePath, docType) => {
        const sql = `INSERT INTO claim_documents (claim_id, file_path, document_type) VALUES (?, ?, ?)`;
        await db.query(sql, [claimId, filePath, docType]);
    },

    /**
     * Check if a policy already has an active claim (not rejected or paid).
     */
    hasActiveClaim: async (policyId) => {
        const sql = `SELECT id FROM claims WHERE policy_id = ? AND status NOT IN ('rejected', 'paid') LIMIT 1`;
        const [rows] = await db.query(sql, [policyId]);
        return rows.length > 0;
    },

    /**
     * Get claims for a specific user.
     */
    getByUser: async (userId) => {
        const sql = `
            SELECT 
                c.*, 
                p.policy_number,
                p.vehicle_type,
                p.manufacturing_year
            FROM claims c
            JOIN policies p ON c.policy_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `;
        const [rows] = await db.query(sql, [userId]);
        return rows;
    },

    /**
     * Get claim by ID with documents.
     */
    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM claims WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        
        const [docs] = await db.query('SELECT * FROM claim_documents WHERE claim_id = ?', [id]);
        rows[0].documents = docs;
        return rows[0];
    },

    /**
     * Admin: Get all claims with policy details and documents.
     */
    getAllDetailed: async (statusFilter = null) => {
        let sql = `
            SELECT 
                c.*, 
                p.policy_number,
                u.name as user_name,
                u.email as user_email
            FROM claims c
            JOIN policies p ON c.policy_id = p.id
            JOIN users u ON c.user_id = u.id
        `;
        const params = [];
        if (statusFilter) {
            sql += ` WHERE c.status = ?`;
            params.push(statusFilter);
        }
        sql += ` ORDER BY c.created_at DESC`;
        
        const [claims] = await db.query(sql, params);

        // Fetch docs for these claims
        if (claims.length > 0) {
            const claimIds = claims.map(c => c.id);
            const [docs] = await db.query('SELECT * FROM claim_documents WHERE claim_id IN (?)', [claimIds]);
            
            // Map docs to claims
            claims.forEach(claim => {
                claim.documents = docs.filter(d => d.claim_id === claim.id);
            });
        }
        
        return claims;
    },

    /**
     * Admin: Update claim status and stage.
     */
    updateStatus: async (id, status, currentStage, rejectionReason = null) => {
        const sql = `UPDATE claims SET status = ?, current_stage = ?, rejection_reason = ? WHERE id = ?`;
        await db.query(sql, [status, currentStage, rejectionReason, id]);
    },

    /**
     * Admin: Verify an individual document.
     */
    verifyDocument: async (docId, isVerified, notes = '') => {
        const sql = `UPDATE claim_documents SET is_verified = ?, verification_notes = ? WHERE id = ?`;
        await db.query(sql, [isVerified, notes, docId]);
    },

    /**
     * Admin: Approve claim and set payout.
     */
    approveWithPayout: async (id, payoutAmount) => {
        const sql = `UPDATE claims SET status = 'approved', current_stage = 4, payout_amount = ? WHERE id = ?`;
        await db.query(sql, [payoutAmount, id]);
    },

    /**
     * Admin: Mark as paid.
     */
    markAsPaid: async (id) => {
        const sql = `UPDATE claims SET status = 'paid', current_stage = 5, payout_status = 'processed' WHERE id = ?`;
        await db.query(sql, [id]);
    }
};

module.exports = Claim;
