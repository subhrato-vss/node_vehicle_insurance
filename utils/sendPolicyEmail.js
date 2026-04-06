const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
    if (transporter) return transporter;
    
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    return transporter;
}

/**
 * sendPolicySuccessEmail
 * Professional HTML template for policy confirmation.
 */
const sendPolicySuccessEmail = async (toEmail, policyDetails) => {
    try {
        const mailer = await getTransporter();
        
        const { policyNumber, customerName, planName, vehicleDetails, finalPremium, endDate } = policyDetails;

        await mailer.sendMail({
            from: `"DriveGuard Insurance" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Policy Confirmed: ${policyNumber} - DriveGuard Insurance`,
            text: `Congratulations ${customerName}! Your policy ${policyNumber} is now active.`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w-600px; margin: auto; background-color: #f8fafc; padding: 40px; color: #1e293b;">
                    <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius: 16px; color: #ffffff; font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">
                                DriveGuard
                            </div>
                        </div>

                        <!-- Hero Message -->
                        <div style="text-align: center; margin-bottom: 40px;">
                            <div style="width: 64px; hieght: 64px; background-color: #f0fdf4; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                                <span style="font-size: 32px; color: #16a34a;">✓</span>
                            </div>
                            <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.025em;">Policy Confirmed!</h1>
                            <p style="font-size: 16px; color: #64748b; margin: 0;">Congratulations ${customerName}, your vehicle is now fully protected.</p>
                        </div>

                        <!-- Policy Card -->
                        <div style="background-color: #f1f5f9; border-radius: 20px; padding: 25px; margin-bottom: 35px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 15px;">
                                <span style="font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Policy Number</span>
                                <span style="font-size: 16px; font-weight: 800; color: #2563eb;">${policyNumber}</span>
                            </div>
                            
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #64748b;">Vehicle Details</td>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-align: right;">${vehicleDetails}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #64748b;">Selected Plan</td>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #4f46e5; text-align: right;">${planName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #64748b;">Valid Until</td>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-align: right;">${new Date(endDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0 0 0; font-size: 16px; font-weight: 800; color: #0f172a;">Total Paid</td>
                                    <td style="padding: 15px 0 0 0; font-size: 20px; font-weight: 900; color: #0f172a; text-align: right;">₹${parseFloat(finalPremium).toLocaleString('en-IN')}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- CTA Section -->
                        <div style="text-align: center;">
                            <p style="font-size: 14px; color: #475569; margin-bottom: 25px; line-height: 1.6;">Your digital policy document is attached below. You can also view and manage your policy via our dashboard.</p>
                            <a href="${process.env.APP_URL || 'http://localhost:3000'}/user/login" style="display: inline-block; padding: 18px 36px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.4);">
                                Login to Dashboard
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">You received this email because you recently purchased insurance from DriveGuard.<br>© ${new Date().getFullYear()} DriveGuard Insurance. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        console.log("📧 Successfully sent Policy Success email to", toEmail);
        return true;

    } catch (e) {
        console.error("Error sending Policy Success email:", e);
        return false;
    }
};

module.exports = sendPolicySuccessEmail;
