const nodemailer = require('nodemailer');

// Reuse a constant test account or quickly dynamically generate one
// We'll hardcode one so we don't spam Ethereal account creation too much, 
// but using nodemailer.createTestAccount() works too.

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

const sendOtpEmail = async (toEmail, otp) => {
    try {
        const mailer = await getTransporter();
        
        await mailer.sendMail({
            from: `"DriveGuard Insurance" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Your DriveGuard Login OTP",
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-w-md; margin:auto; padding: 20px; text-align: center; border: 1px solid #ddd; border-radius: 12px;">
                    <h2 style="color: #2563eb;">DriveGuard Insurance</h2>
                    <p style="color: #555;">Please use the verification code below to sign in.</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; border-radius: 8px; background: #f3f4f6; color: #111; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="font-size: 12px; color: #888;">This code will expire in 5 minutes.</p>
                </div>
            `,
        });

        console.log("📧 Successfully sent OTP email to", toEmail);
        return true;

    } catch (e) {
        console.error("Error sending OTP email:", e);
        return false;
    }
};

module.exports = sendOtpEmail;
