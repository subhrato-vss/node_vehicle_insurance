/**
 * policyModel.js
 * CRUD operations for policies_temp table.
 */
const db = require('../config/db');

const Policy = {

    /**
     * Create a new temporary policy application.
     */
    create: async (data) => {
        const sql = `INSERT INTO policies_temp 
            (customer_name, customer_email, customer_mobile, address_line1, address_line2,
             customer_city, customer_state, customer_pincode,
             variant_id, vehicle_type, manufacturing_year, fuel_type, rto_city, previous_claim,
             base_premium, idv, plan_id, plan_name, plan_price, addons, addons_cost, final_premium, paid_amount, actual_amount, parent_policy_id, renewal_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(sql, [
            data.customer_name,
            data.customer_email,
            data.customer_mobile,
            data.address_line1,
            data.address_line2 || null,
            data.customer_city,
            data.customer_state,
            data.customer_pincode,
            data.variant_id,
            data.vehicle_type,
            data.manufacturing_year,
            data.fuel_type,
            data.rto_city,
            data.previous_claim,
            data.base_premium,
            data.idv,
            data.plan_id,
            data.plan_name,
            data.plan_price,
            JSON.stringify(data.addons || []),
            data.addons_cost || 0,
            data.final_premium,
            data.paid_amount || data.final_premium,
            data.actual_amount || data.final_premium,
            data.parent_policy_id || null,
            data.renewal_count || 0
        ]);

        return result.insertId;
    },

    /**
     * Find by ID (Temp Table).
     */
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM policies_temp WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * Find by ID (Final Table).
     */
    findFinalById: async (id) => {
        const [rows] = await db.query('SELECT * FROM policies WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * Update status.
     */
    updateStatus: async (id, status) => {
        await db.query('UPDATE policies_temp SET status = ? WHERE id = ?', [status, id]);
    },

    /**
     * Update payment info (payment_id, order_id, payment_method, status).
     */
    updatePayment: async (id, data) => {
        const fields = [];
        const values = [];

        if (data.payment_id !== undefined)    { fields.push('payment_id = ?');    values.push(data.payment_id); }
        if (data.order_id !== undefined)      { fields.push('order_id = ?');      values.push(data.order_id); }
        if (data.payment_method !== undefined) { fields.push('payment_method = ?'); values.push(data.payment_method); }
        if (data.status !== undefined)        { fields.push('status = ?');        values.push(data.status); }
        if (data.paid_amount !== undefined)   { fields.push('paid_amount = ?');   values.push(data.paid_amount); }
        if (data.actual_amount !== undefined) { fields.push('actual_amount = ?'); values.push(data.actual_amount); }

        if (fields.length === 0) return;

        values.push(id);
        await db.query(`UPDATE policies_temp SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    /**
     * Get all policies (admin).
     */
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM policies_temp ORDER BY created_at DESC');
        return rows;
    },

    /**
     * Move policy from temp to final table
     */
    moveToFinal: async (tempId, policyNumber) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query('SELECT * FROM policies_temp WHERE id = ?', [tempId]);
            const tempPolicy = rows[0];

            if (!tempPolicy) {
                throw new Error("Temporary policy not found");
            }

            // Handle Dates for Start/End
            const today = new Date();
            let startDate = new Date(today);
            
            // If renewing, check if the parent policy is still active
            if (tempPolicy.parent_policy_id) {
                const [pRows] = await connection.query('SELECT end_date, status FROM policies WHERE id = ?', [tempPolicy.parent_policy_id]);
                if (pRows[0] && pRows[0].status === 'active') {
                    const parentEndDate = new Date(pRows[0].end_date);
                    if (parentEndDate > today) {
                        startDate = parentEndDate; // Stack it back to back
                    }
                    // Mark old policy as expired (this fulfills the new renewal overriding it)
                    await connection.query("UPDATE policies SET status = 'expired' WHERE id = ?", [tempPolicy.parent_policy_id]);
                }
            }
            
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);

            const sDateStr = startDate.toISOString().split('T')[0];
            const eDateStr = endDate.toISOString().split('T')[0];

            const insertSql = `INSERT INTO policies 
                (policy_number, customer_name, customer_email, customer_mobile, address_line1, address_line2,
                 customer_city, customer_state, customer_pincode, variant_id, vehicle_type, manufacturing_year,
                 fuel_type, rto_city, previous_claim, base_premium, idv, plan_id, plan_name, plan_price,
                 addons, addons_cost, final_premium, paid_amount, actual_amount, payment_id, order_id, payment_method,
                 parent_policy_id, renewal_count, start_date, end_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            await connection.query(insertSql, [
                policyNumber, tempPolicy.customer_name, tempPolicy.customer_email, tempPolicy.customer_mobile,
                tempPolicy.address_line1, tempPolicy.address_line2, tempPolicy.customer_city, tempPolicy.customer_state,
                tempPolicy.customer_pincode, tempPolicy.variant_id, tempPolicy.vehicle_type, tempPolicy.manufacturing_year,
                tempPolicy.fuel_type, tempPolicy.rto_city, tempPolicy.previous_claim, tempPolicy.base_premium, tempPolicy.idv,
                tempPolicy.plan_id, tempPolicy.plan_name, tempPolicy.plan_price, 
                typeof tempPolicy.addons === 'string' ? tempPolicy.addons : JSON.stringify(tempPolicy.addons || []), 
                tempPolicy.addons_cost,
                tempPolicy.final_premium, tempPolicy.paid_amount, tempPolicy.actual_amount,
                tempPolicy.payment_id, tempPolicy.order_id, tempPolicy.payment_method,
                tempPolicy.parent_policy_id, tempPolicy.renewal_count || 0, sDateStr, eDateStr, 'active'
            ]);

            // Delete the temp policy
            await connection.query('DELETE FROM policies_temp WHERE id = ?', [tempId]);

            await connection.commit();
            return policyNumber;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Get last policy ID sequentially to assign a new number.
     */
    getLastFinalPolicyId: async () => {
        const [rows] = await db.query('SELECT id FROM policies ORDER BY id DESC LIMIT 1');
        return rows[0] ? rows[0].id : 0;
    },

    /**
     * Get final policy by number.
     */
    getFinalPolicyByNumber: async (policyNumber) => {
        const [rows] = await db.query('SELECT * FROM policies WHERE policy_number = ?', [policyNumber]);
        return rows[0] || null;
    },

    /**
     * Get final policy with vehicle details (Brand, Model, Variant)
     */
    getDetailedPolicy: async (policyNumber) => {
        const sql = `
            SELECT 
                p.*,
                v.name as variant_name,
                m.name as model_name,
                b.name as brand_name
            FROM policies p
            LEFT JOIN variants v ON p.variant_id = v.id
            LEFT JOIN models m ON v.model_id = m.id
            LEFT JOIN brands b ON m.brand_id = b.id
            WHERE p.policy_number = ?
        `;
        const [rows] = await db.query(sql, [policyNumber]);
        return rows[0] || null;
    },

    /**
     * Get Policy History (Lineage)
     */
    getPolicyHistory: async (policyId) => {
        let rootFound = false;
        let currentId = policyId;
        
        // Go up
        while(!rootFound) {
            const [rows] = await db.query('SELECT id, parent_policy_id FROM policies WHERE id = ?', [currentId]);
            if (!rows[0] || !rows[0].parent_policy_id) {
                rootFound = true;
            } else {
                currentId = rows[0].parent_policy_id;
            }
        }
        
        // Go down
        let lineage = [];
        let searching = true;
        let nextId = currentId;

        while(searching) {
            const [rows] = await db.query('SELECT id, policy_number, parent_policy_id, start_date, end_date, final_premium, status, created_at, renewal_count, vehicle_type, plan_name, manufacturing_year FROM policies WHERE id = ?', [nextId]);
            if (rows[0]) {
                lineage.push(rows[0]);
                const [children] = await db.query('SELECT id FROM policies WHERE parent_policy_id = ? ORDER BY created_at ASC LIMIT 1', [nextId]);
                if (children[0]) {
                    nextId = children[0].id;
                } else {
                    searching = false;
                }
            } else {
                searching = false;
            }
        }
        return lineage.sort((a,b) => a.renewal_count - b.renewal_count);
    },

    /**
     * Get all finalized policies (admin).
     */
    getAllFinalDetailed: async () => {
        const sql = `
            SELECT 
                p.*,
                v.name as variant_name,
                m.name as model_name,
                b.name as brand_name
            FROM policies p
            LEFT JOIN variants v ON p.variant_id = v.id
            LEFT JOIN models m ON v.model_id = m.id
            LEFT JOIN brands b ON m.brand_id = b.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    /**
     * Check if an active policy exists for the same user and vehicle variant.
     */
    checkDuplicate: async (email, variantId) => {
        const sql = `
            SELECT p.id, p.policy_number, p.end_date, p.status
            FROM policies p
            INNER JOIN users u ON p.user_id = u.id
            WHERE u.email = ?
            AND p.variant_id = ?
            AND p.status = 'active'
            ORDER BY p.end_date DESC
            LIMIT 1
        `;
        const [rows] = await db.query(sql, [email, variantId]);
        return rows[0] || null;
    }
};

module.exports = Policy;
