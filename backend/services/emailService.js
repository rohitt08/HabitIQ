import logger from "../utils/logger.js";

/**
 * Brevo REST API Email Service
 * Completely bypasses Render's SMTP firewall block.
 */

const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'YOUR_BREVO_API_KEY_HERE') {
        logger.error("BREVO_API_KEY is missing or invalid in environment variables.");
        logger.info(`[MOCK EMAIL] To: ${toEmail} | Subject: ${subject}`);
        return true;
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { 
                    name: "HabitIQ Team", 
                    email: process.env.EMAIL_SENDER || "habitiq.team@gmail.com" 
                },
                to: [{ email: toEmail }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        logger.info(`Email successfully sent via Brevo to ${toEmail}. Message ID: ${data.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Error sending email via Brevo API: ${error.message}`);
        throw new Error("Failed to send verification email");
    }
};

const getOtpTemplate = (otp, purpose) => {
    const isDark = true;
    const bgColor = isDark ? "#0f172a" : "#f8fafc";
    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const textColor = isDark ? "#f1f5f9" : "#334155";
    const primaryColor = "#f59e0b"; // amber-500
    const title = purpose === "password_reset" ? "Reset Your Password" : "Verify Your Email";
    const message = purpose === "password_reset"
        ? "Someone requested to reset your password. If it wasn't you, safely ignore this."
        : "Welcome to HabitIQ! Use this code to verify your email address and get started.";

    return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${bgColor}; padding: 40px 20px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); width: 48px; height: 48px; border-radius: 12px; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                <h1 style="color: white; margin: 0; font-size: 24px;">✨</h1>
            </div>
            <h2 style="color: ${textColor}; font-size: 24px; font-weight: 700; margin-top: 16px; margin-bottom: 8px;">${title}</h2>
            <p style="color: #64748b; font-size: 16px; margin: 0;">${message}</p>
        </div>

        <div style="background-color: ${cardBg}; padding: 32px; border-radius: 12px; text-align: center; border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};">
            <p style="color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; margin-top: 0;">Your Verification Code</p>
            <div style="background-color: ${isDark ? '#0f172a' : '#f8fafc'}; padding: 16px 24px; border-radius: 8px; display: inline-block; border: 1px dashed ${primaryColor};">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: ${primaryColor}; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px; margin-bottom: 0;">This code expires in 10 minutes.</p>
        </div>

        <div style="text-align: center; margin-top: 32px; color: #64748b; font-size: 12px;">
            <p>Ready to build better habits? <br/>© 2024 HabitIQ. All rights reserved.</p>
        </div>
    </div>
  `;
};

export const sendOtpEmail = async (email, otp, purpose = "registration") => {
    const subject = purpose === "password_reset" ? "Reset your HabitIQ password" : "Your HabitIQ verification code";
    const htmlContent = getOtpTemplate(otp, purpose);
    
    return await sendEmailViaBrevo(email, subject, htmlContent);
};
