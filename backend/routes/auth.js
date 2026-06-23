import express from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";
import { 
    sendOtp,
    verifyOtp,
    register,
    login,
    logout,
    me,
    updateProfile,
    updateSettings,
    savePushSubscription,
    removePushSubscription,
    getVapidPublicKey,
    deleteAccount,
    forgotPassword,
    resetPassword
 } from "../controllers/authController.js"

import { protect } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:login:',
  }),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  limit: 5, // start blocking after 5 requests
  message: { message: "Too many accounts created from this IP, please try again after an hour" },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:register:',
  }),
});

const otpLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  limit: 7, // hard limit of 7 OTP requests per day
  message: { message: "You have reached the maximum number of OTP requests (7 per day). Please try again tomorrow." },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:otp:',
  }),
});

const router = express.Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", registerLimiter, verifyOtp);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", loginLimiter, resetPassword);
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.put("/settings", protect, updateSettings);
router.post("/push-subscription", protect, savePushSubscription);
router.delete("/push-subscription", protect, removePushSubscription);
router.get("/vapid-public-key", getVapidPublicKey);
router.delete("/me", protect, deleteAccount);

export default router;
