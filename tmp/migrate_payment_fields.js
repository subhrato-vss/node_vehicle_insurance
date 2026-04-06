const db = require('../config/db');

async function migrate() {
  try {
    console.log("Checking columns in policies_temp...");
    const [tempCols] = await db.query("SHOW COLUMNS FROM policies_temp");
    const tempColNames = tempCols.map(c => c.Field);
    
    if (!tempColNames.includes('paid_amount')) {
      await db.query("ALTER TABLE policies_temp ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0.00 AFTER final_premium");
      console.log("Added paid_amount to policies_temp");
    }
    if (!tempColNames.includes('actual_amount')) {
      await db.query("ALTER TABLE policies_temp ADD COLUMN actual_amount DECIMAL(10,2) DEFAULT 0.00 AFTER paid_amount");
      console.log("Added actual_amount to policies_temp");
    }

    console.log("Checking columns in policies...");
    const [finalCols] = await db.query("SHOW COLUMNS FROM policies");
    const finalColNames = finalCols.map(c => c.Field);
    
    if (!finalColNames.includes('paid_amount')) {
      await db.query("ALTER TABLE policies ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0.00 AFTER final_premium");
      console.log("Added paid_amount to policies");
    }
    if (!finalColNames.includes('actual_amount')) {
      await db.query("ALTER TABLE policies ADD COLUMN actual_amount DECIMAL(10,2) DEFAULT 0.00 AFTER paid_amount");
      console.log("Added actual_amount to policies");
    }

    console.log("Migration finished.");
    process.exit(0);
  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
}

migrate();
