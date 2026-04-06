/**
 * pdfGenerator.js
 * Professional PDF Generation for Insurance Policies
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfGenerator = {
    /**
     * Main function to generate the policy PDF
     */
    generatePolicyPDF: async (policy, outputPath) => {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                    size: 'A4'
                });

                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                const primaryColor = '#2563eb'; // Blue
                const secondaryColor = '#1e40af'; // Darker Blue
                const textColor = '#1f2937'; // Dark Gray
                const labelColor = '#4b5563'; // Medium Gray
                const borderColor = '#e5e7eb'; // Light Gray
                const successColor = '#059669'; // Green

                // --- 1. HEADER ---
                const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 45, { width: 50 });
                }

                doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('DriveGuard Insurance', 110, 50);
                doc.fillColor(labelColor).fontSize(10).font('Helvetica').text('Secure your journey with us.', 110, 75);

                // Top Right: Policy No & Date
                doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(`Policy No: ${policy.policy_number}`, 400, 50, { align: 'right' });
                doc.fillColor(labelColor).fontSize(10).font('Helvetica').text(`Issue Date: ${new Date(policy.created_at).toLocaleDateString()}`, 400, 65, { align: 'right' });

                doc.moveDown(2);
                doc.strokeColor(borderColor).lineWidth(1).moveTo(50, 110).lineTo(545, 110).stroke();
                doc.moveDown(1.5);



                // --- 2. SECTIONS ---
                
                // Helper to draw section header
                const drawSectionHeader = (title, y) => {
                    doc.rect(50, y, 495, 20).fill('#f3f4f6');
                    doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text(title.toUpperCase(), 60, y + 5);
                    return y + 30;
                };

                let currentY = doc.y;

                // SECTION: Customer Details
                currentY = drawSectionHeader('Customer Details', currentY);
                doc.fillColor(labelColor).fontSize(10).font('Helvetica').text('Name:', 60, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.customer_name, 150, currentY);
                
                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('Email:', 60, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.customer_email, 150, currentY);

                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('Mobile:', 60, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.customer_mobile, 150, currentY);

                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('Address:', 60, currentY);
                const addressText = `${policy.address_line1}${policy.address_line2 ? ', ' + policy.address_line2 : ''}\n${policy.customer_city}, ${policy.customer_state} - ${policy.customer_pincode}`;
                doc.fillColor(textColor).font('Helvetica-Bold').text(addressText, 150, currentY, { width: 350 });
                
                currentY += 25;

                // SECTION: Vehicle Details
                currentY = drawSectionHeader('Vehicle Details', currentY);
                
                const col1 = 60, col2 = 140, col3 = 300, col4 = 400;
                
                doc.fillColor(labelColor).fontSize(10).font('Helvetica').text('Brand:', col1, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.brand_name || 'N/A', col2, currentY);
                doc.fillColor(labelColor).font('Helvetica').text('Model:', col3, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.model_name || 'N/A', col4, currentY);

                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('Variant:', col1, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.variant_name || 'N/A', col2, currentY, { width: 150 });
                doc.fillColor(labelColor).font('Helvetica').text('Year:', col3, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.manufacturing_year.toString(), col4, currentY);

                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('Fuel Type:', col1, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.fuel_type.toUpperCase(), col2, currentY);
                doc.fillColor(labelColor).font('Helvetica').text('Vehicle Type:', col3, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.vehicle_type.toUpperCase(), col4, currentY);

                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('IDV Value:', col1, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text('Rs. ' + Number(policy.idv).toLocaleString('en-IN'), col2, currentY);
                
                currentY += 20;

                // SECTION: Policy Details
                currentY = drawSectionHeader('Policy Details', currentY);
                doc.fillColor(labelColor).font('Helvetica').text('Plan Name:', col1, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(policy.plan_name, col2, currentY);
                doc.fillColor(labelColor).font('Helvetica').text('Status:', col3, currentY);
                doc.fillColor(successColor).font('Helvetica-Bold').text(policy.status.toUpperCase(), col4, currentY);

                currentY += 15;
                doc.fillColor(labelColor).font('Helvetica').text('Start Date:', col1, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(new Date(policy.start_date).toLocaleDateString(), col2, currentY);
                doc.fillColor(labelColor).font('Helvetica').text('End Date:', col3, currentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(new Date(policy.end_date).toLocaleDateString(), col4, currentY);

                currentY += 20;

                // SECTION: Add-ons
                currentY = drawSectionHeader('Included Add-ons', currentY);
                let addons = [];
                try { addons = typeof policy.addons === 'string' ? JSON.parse(policy.addons) : policy.addons; } catch (e) { }
                
                if (addons && addons.length > 0) {
                    const mapAddon = { zero_dep: 'Zero Depreciation', engine_protect: 'Engine Protection', rsa: 'Roadside Assistance', consumables: 'Consumables Cover' };
                    addons.forEach(addon => {
                        doc.fillColor(textColor).font('Helvetica').text(`• ${mapAddon[addon] || addon}`, 65, currentY);
                        currentY += 14;
                    });
                } else {
                    doc.fillColor(labelColor).font('Helvetica-Oblique').text('No optional add-ons selected.', 65, currentY);
                    currentY += 14;
                }
                
                currentY += 15;

                // SECTION: Premium Breakdown
                currentY = drawSectionHeader('Premium Breakdown', currentY);
                
                doc.rect(50, currentY, 495, 80).stroke(borderColor);
                
                let breakY = currentY + 10;
                doc.fillColor(labelColor).font('Helvetica').text('Basic Plan Premium', 65, breakY);
                doc.fillColor(textColor).text('Rs. ' + Number(policy.plan_price).toLocaleString('en-IN'), 400, breakY, { align: 'right', width: 135 });
                
                breakY += 20;
                doc.fillColor(labelColor).text('Add-ons Total Cost', 65, breakY);
                doc.fillColor(textColor).text('Rs. ' + Number(policy.addons_cost).toLocaleString('en-IN'), 400, breakY, { align: 'right', width: 135 });
                
                breakY += 15;
                doc.strokeColor(borderColor).moveTo(65, breakY).lineTo(535, breakY).stroke();
                
                breakY += 10;
                doc.fillColor(textColor).fontSize(13).font('Helvetica-Bold').text('Total Final Premium', 65, breakY);
                doc.fillColor(successColor).text('Rs. ' + Number(policy.final_premium).toLocaleString('en-IN'), 400, breakY, { align: 'right', width: 135 });

                // --- 3. FOOTER ---
                const footerY = 770;
                doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, footerY).lineTo(545, footerY).stroke();
                
                doc.fillColor(labelColor).fontSize(8).font('Helvetica').text('This is a computer generated document. No physical signature is required.', 50, footerY + 10, { align: 'center' });
                doc.text(`Payment Reference: ${policy.payment_id} | Method: ${policy.payment_method.toUpperCase()}`, { align: 'center' });
                doc.moveDown(0.5);
                doc.fillColor(secondaryColor).font('Helvetica-Bold').text('For support contact: support@driveguard.com | Call: 1800-DRIVE-SAFE', { align: 'center' });

                doc.end();
                stream.on('finish', resolve);
                stream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = pdfGenerator;
