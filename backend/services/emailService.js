import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// Mock email service for development
// In production, configure SMTP credentials via environment variables
const createTransporter = async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Fallback to Ethereal mock for development if no SMTP config is present
    logger.info("No SMTP config found. Creating mock Ethereal account...");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
};

export const sendOtpEmail = async (email, otp, purpose = "registration") => {
    try {
        const transporter = await createTransporter();

        const isReset = purpose === "password_reset";
        const subject = isReset ? "HabitIQ - Password Reset Code" : "HabitIQ - Your Verification Code";
        const textStr = isReset 
            ? `Your password reset code is: ${otp}. It will expire in 5 minutes.` 
            : `Your verification code is: ${otp}. It will expire in 5 minutes.`;
        
        const titleText = isReset ? "Password Reset Request 🔐" : "Welcome to HabitIQ! ✨";
        const bodyText = isReset 
            ? "We received a request to reset the password for your HabitIQ account. Use the secure verification code below to proceed with your password reset. If you did not request this, please ignore this email and your password will remain unchanged."
            : "You're just one step away from building better habits and unlocking AI-powered insights for your daily routines. Use the verification code below to complete your setup.";
        const codeLabel = isReset ? "Your Reset Code" : "Your Verification Code";

        const info = await transporter.sendMail({
            from: `"HabitIQ" <${process.env.SMTP_USER || 'noreply@habitiq.app'}>`,
            replyTo: process.env.SMTP_USER || 'noreply@habitiq.app',
            to: email,
            subject: subject,
            text: textStr,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #faf8f2; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fef3c7 0%, #ffedd5 50%, #fee2e2 100%); padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: rgba(255, 255, 255, 0.65); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 8px 32px rgba(245, 158, 11, 0.1); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); overflow: hidden;">
                                    <tr>
                                        <td style="padding: 40px;">
                                            <div style="text-align: center; margin-bottom: 30px;">
                                                <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #b45309); padding: 16px; border-radius: 18px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                                                    <img src="https://api.iconify.design/lucide:sparkles.svg?color=white&width=48&height=48" width="48" height="48" alt="HabitIQ" style="display: block; width: 48px; height: 48px;">
                                                </div>
                                                <h1 style="margin: 16px 0 0; font-size: 26px; color: #1f2937; letter-spacing: -0.5px; font-weight: 800;">HabitIQ</h1>
                                            </div>

                                            <h2 style="margin: 0 0 16px; font-size: 22px; color: #374151; font-weight: 700; text-align: center;">${titleText}</h2>
                                            <p style="margin: 0 auto 32px; font-size: 16px; color: #4b5563; line-height: 1.6; text-align: center; max-width: 480px;">
                                                ${bodyText}
                                            </p>

                                            <div style="background-color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 1); border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); max-width: 320px; margin-left: auto; margin-right: auto;">
                                                <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">${codeLabel}</p>
                                                <h1 style="margin: 0; font-size: 46px; font-weight: 800; letter-spacing: 10px; color: #b45309;">${otp}</h1>
                                            </div>

                                            <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.6; text-align: center;">
                                                This code securely expires in <strong>5 minutes</strong>.<br>
                                                If you didn't request this, you can safely ignore this email.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                                    © 2026 HabitIQ. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        });

        logger.info(`OTP sent to ${email}. Message ID: ${info.messageId}`);

        // If using Ethereal, print the preview URL so the developer can see the email
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            logger.info(`Preview Mock Email: ${previewUrl}`);
            // Also print OTP directly to console for super easy dev testing
            logger.info(`[DEV MODE] The OTP is: ${otp}`);
        }

        return true;
    } catch (error) {
        logger.error(`Error sending OTP email: ${error.message}`);
        throw new Error("Failed to send verification email");
    }
};
