const db = require('./config/db');

async function migrate() {
    try {
        console.log("Starting DB Migration for Renewals...");

        // Try adding parent_policy_id and renewal_count to policies_temp
        try {
            await db.query(`ALTER TABLE policies_temp 
                ADD COLUMN parent_policy_id INT NULL, 
                ADD COLUMN renewal_count INT DEFAULT 0`);
            console.log("Added renewal fields to policies_temp");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("Fields already exist in policies_temp");
            else throw e;
        }

        // Try adding parent_policy_id and renewal_count to policies
        try {
            await db.query(`ALTER TABLE policies 
                ADD COLUMN parent_policy_id INT NULL, 
                ADD COLUMN renewal_count INT DEFAULT 0`);
            console.log("Added renewal fields to policies");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("Fields already exist in policies");
            else throw e;
        }

        // Add start_date, end_date, status if they don't exist
        try {
            await db.query(`ALTER TABLE policies 
                ADD COLUMN start_date DATE,
                ADD COLUMN end_date DATE,
                ADD COLUMN status ENUM('active', 'expired') DEFAULT 'active'`);
            console.log("Added date and status fields to policies");
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("Date/Status fields already exist in policies");
            else throw e;
        }

        // Let's populate missing start_date/end_date assuming 1 year validity from created_at
        await db.query(`UPDATE policies SET start_date = DATE(created_at), end_date = DATE(DATE_ADD(created_at, INTERVAL 1 YEAR)) WHERE start_date IS NULL`);

        console.log("Migration complete!");
        process.exit(0);

    } catch (e) {
        console.error("Migration Failed: ", e);
        process.exit(1);
    }
}

migrate();
