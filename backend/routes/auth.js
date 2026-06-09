import express from "express";
import rateLimit from "express-rate-limit";
import { 
    register,
    login,
    logout,
    me,
    updateProfile,
    updateSettings,
    savePushSubscription,
    getVapidPublicKey
 } from "../controllers/authController.js"

import { protect } from "../middleware/auth.js";


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const router = express.Router();

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);
router.put("/settings", protect, updateSettings);
router.post("/push-subscription", protect, savePushSubscription);
router.get("/vapid-public-key", getVapidPublicKey);

export default router;
