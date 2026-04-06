/**
 * regenerate_pdfs.js
 * Script to regenerate all policy PDFs with the new professional layout.
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const Policy = require('../models/policyModel');
const pdfGenerator = require('../utils/pdfGenerator');

async function run() {
    console.log("Starting PDF Regeneration...");
    try {
        const [policies] = await db.query("SELECT policy_number FROM policies");
        console.log(`Found ${policies.length} policies to process.`);

        for (const p of policies) {
            console.log(`Processing ${p.policy_number}...`);
            const detailedPolicy = await Policy.getDetailedPolicy(p.policy_number);
            if (!detailedPolicy) {
                console.error(`Could not find detailed data for ${p.policy_number}`);
                continue;
            }

            const pdfFilename = `POLICY_${p.policy_number}.pdf`;
            const pdfPath = path.join(__dirname, '..', 'public', 'policies', pdfFilename);

            // Ensure destination directory exists
            const dir = path.dirname(pdfPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            await pdfGenerator.generatePolicyPDF(detailedPolicy, pdfPath);
            console.log(`  Saved: ${pdfFilename}`);
        }

        console.log("Regeneration Complete!");
        process.exit(0);
    } catch (error) {
        console.error("Regeneration Failed:", error);
        process.exit(1);
    }
}

run();
