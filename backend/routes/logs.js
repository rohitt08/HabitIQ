import express from "express";
import {
    markComplete,
    unmarkComplete,
    getToday,
    getRange,
    getHeatmap,
    getHabitStats,
    getAllStats,
    getDashboardStreaks,
} from "../controllers/logController.js";

import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const logLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // Limit each IP to 30 requests per minute
  message: { message: "Too many logging attempts, please try again later" },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const router = express.Router();

router.use(protect);

router.post("/", logLimiter, markComplete);
router.delete("/", unmarkComplete);
router.get("/today", getToday);
router.get("/range", getRange);
router.get("/heatmap", getHeatmap);
router.get("/dashboard-streaks", getDashboardStreaks);
router.get("/stats", getAllStats);
router.get("/stats/:habitId", getHabitStats);

export default router;