/**
 * db_debug_fix.js
 * Adds missing columns to the policies_temp table.
 */
const db = require('../config/db');

async function fixTable() {
    try {
        console.log('Checking policies_temp table...');
        
        const [columns] = await db.query('SHOW COLUMNS FROM policies_temp');
        const columnNames = columns.map(c => c.Field);
        
        const required = [
            { name: 'payment_id', type: 'VARCHAR(100) DEFAULT NULL' },
            { name: 'order_id', type: 'VARCHAR(100) DEFAULT NULL' },
            { name: 'payment_method', type: 'VARCHAR(50) DEFAULT NULL' },
            { name: 'paid_amount', type: 'DECIMAL(12,2) DEFAULT 0.00' },
            { name: 'actual_amount', type: 'DECIMAL(12,2) DEFAULT 0.00' },
            { name: 'parent_policy_id', type: 'INT DEFAULT NULL' },
            { name: 'renewal_count', type: 'INT DEFAULT 0' }
        ];
        
        for (const col of required) {
            if (!columnNames.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                await db.query(`ALTER TABLE policies_temp ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }
        
        console.log('All missing columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Database migration error:', error);
        process.exit(1);
    }
}

fixTable();
