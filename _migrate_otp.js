const db = require('./config/db');

(async () => {
    try {
        console.log("Starting DB Migration...");
        
        // 1. otp_verifications table
        await db.query(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp VARCHAR(10) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        console.log("otp_verifications created");

        // 2. Modify users
        // Add is_verified safely
        try {
            await db.query(`ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;`);
            console.log("is_verified added to users");
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
        
        // Make password optional since new auto-created users won't have one
        try {
            await db.query(`ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;`);
            console.log("users password made nullable");
        } catch(e) { throw e; }

        // 3. Modifying policies
        // Add user_id
        try {
            await db.query(`ALTER TABLE policies ADD COLUMN user_id INT NULL;`);
            console.log("user_id added to policies");
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
        
        // Add FK constraint if it doesn't exist
        try {
            await db.query(`ALTER TABLE policies ADD CONSTRAINT fk_policy_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;`);
            console.log("fk_policy_user added to policies");
        } catch(e) { if(!e.message.includes('Duplicate field') && !e.message.includes('Duplicate foreign key')) throw e; }

        console.log('Migration Completed Successfully!');
    } catch (e) {
        console.error('Migration Error:', e);
    }
    process.exit();
})();
