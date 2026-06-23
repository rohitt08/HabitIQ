import logger from "../utils/logger.js";

/**
 * Resend REST API Email Service
 * Completely bypasses Render's SMTP firewall block.
 */

const sendEmailViaResend = async (toEmail, subject, htmlContent) => {
    if (!process.env.RESEND_API_KEY) {
        logger.error("RESEND_API_KEY is missing in environment variables.");
        logger.info(`[MOCK EMAIL] To: ${toEmail} | Subject: ${subject}`);
        return true;
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: process.env.EMAIL_SENDER || "HabitIQ <onboarding@resend.dev>",
                to: [toEmail],
                subject: subject,
                html: htmlContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        logger.info(`Email successfully sent via Resend to ${toEmail}. Message ID: ${data.id}`);
        return true;
    } catch (error) {
        logger.error(`Error sending email via Resend API: ${error.message}`);
        throw new Error("Failed to send verification email");
    }
};

const getOtpTemplate = (otp, purpose) => {
    const title = purpose === "password_reset" ? "Reset Your Password" : "Verify Your Email";
    const message = purpose === "password_reset"
        ? "We received a request to reset your password. Please use the verification code below to securely change your password. If you didn't request this, you can safely ignore this email."
        : "Welcome to HabitIQ! To complete your registration and secure your account, please use the verification code below.";
        
    const headerText = purpose === "password_reset" ? "Security Alert" : "Welcome Aboard";

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 32px 40px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { color: #ffedd5; margin: 8px 0 0 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
            .content { padding: 48px 40px; }
            .title { color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; text-align: center; }
            .message { color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center; }
            .otp-container { background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; }
            .otp-code { color: #f59e0b; font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 0; }
            .warning-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 32px; }
            .warning-text { color: #92400e; font-size: 14px; margin: 0; line-height: 1.5; font-weight: 500; }
            .footer { border-top: 1px solid #e2e8f0; padding: 32px 40px; text-align: center; background-color: #f8fafc; }
            .footer p { color: #64748b; font-size: 13px; margin: 0 0 8px 0; }
            .footer a { color: #f59e0b; text-decoration: none; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✨ HabitIQ</h1>
                <p>${headerText}</p>
            </div>
            
            <div class="content">
                <h2 class="title">${title}</h2>
                <p class="message">${message}</p>
                
                <div class="otp-container">
                    <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Your Verification Code</p>
                    <p class="otp-code">${otp}</p>
                </div>

                <div class="warning-box">
                    <p class="warning-text">⏳ <strong>Security Notice:</strong> For your protection, this code will expire in exactly <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                </div>
            </div>

            <div class="footer">
                <p>Ready to build better habits? You're in the right place.</p>
                <p>© ${new Date().getFullYear()} HabitIQ. All rights reserved.</p>
                <p>Need help? Reply to this email or contact support.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const sendOtpEmail = async (email, otp, purpose = "registration") => {
    const subject = purpose === "password_reset" ? "Reset your HabitIQ password" : "Your HabitIQ verification code";
    const htmlContent = getOtpTemplate(otp, purpose);
    
    return await sendEmailViaResend(email, subject, htmlContent);
};
