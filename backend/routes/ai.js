import express from "express";
import {
    weeklyReport,
    suggestHabits,
    recoveryPlan,
    chatAnalysis,
    morningMotivation,
} from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

const aiLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    limit: 15, // limit each user to 15 requests per day
    keyGenerator: (req) => req.user._id.toString(), // user ID based
    message: "Greetings! You have exhausted your AI responses for today. Please come back tomorrow for more!",
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:ai:',
    }),
});

const router = express.Router();

router.use(protect);
router.use(aiLimiter);

router.post("/weekly-report", weeklyReport);
router.post("/suggest-habits", suggestHabits);
router.post("/recovery-plan", recoveryPlan);
router.post("/chat", chatAnalysis);
router.get("/morning", morningMotivation);

export default router;
