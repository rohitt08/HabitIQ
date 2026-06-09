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

export const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = await createTransporter();

        const info = await transporter.sendMail({
            from: '"HabitIQ Security" <noreply@habitiq.app>',
            to: email,
            subject: "Your HabitIQ Verification Code",
            text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: sans-serif; max-w-md; margin: 0 auto;">
                    <h2>Welcome to HabitIQ!</h2>
                    <p>Use the following verification code to complete your registration:</p>
                    <h1 style="background: #f4f4f5; padding: 12px; text-align: center; letter-spacing: 4px; border-radius: 8px;">${otp}</h1>
                    <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
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
