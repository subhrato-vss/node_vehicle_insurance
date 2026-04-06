const db = require('../config/db');

async function upgrade() {
    try {
        console.log('--- Starting Claims System Upgrade ---');

        // 1. Update status ENUM separately to avoid issues
        const updateStatusEnum = `
            ALTER TABLE claims 
            MODIFY COLUMN status ENUM('submitted', 'under_review', 'docs_verified', 'approved', 'rejected', 'paid') 
            DEFAULT 'submitted';
        `;
        await db.query(updateStatusEnum);
        console.log('✔ claims table status enum updated.');

        // 2. Add columns one by one for better error handling/compatibility
        const additions = [
            'ALTER TABLE claims ADD COLUMN current_stage INT DEFAULT 1',
            'ALTER TABLE claims ADD COLUMN payout_amount DECIMAL(10,2) DEFAULT 0.00',
            "ALTER TABLE claims ADD COLUMN payout_status ENUM('pending', 'processed') DEFAULT 'pending'",
            'ALTER TABLE claim_documents ADD COLUMN is_verified BOOLEAN DEFAULT false',
            'ALTER TABLE claim_documents ADD COLUMN verification_notes TEXT'
        ];

        for (const sql of additions) {
            try {
                await db.query(sql);
                console.log(`✔ Executed: ${sql.substring(0, 40)}...`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`ℹ Column already exists for: ${sql.substring(0, 40)}...`);
                } else {
                    throw err;
                }
            }
        }

        // 3. Migrate existing "pending" claims to "submitted"
        await db.query("UPDATE claims SET status = 'submitted', current_stage = 1 WHERE status IS NULL OR status = 'pending'");
        
        console.log('--- Upgrade Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Upgrade failed:', error);
        process.exit(1);
    }
}

upgrade();
