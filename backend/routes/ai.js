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

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 15, // limit each IP to 15 requests per windowMs
    message: "Too many AI requests from this IP, please try again after 15 minutes",
    standardHeaders: 'draft-7',
    legacyHeaders: false,
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
