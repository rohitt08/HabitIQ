import express from "express";
import { getLeaderboard, getNearbyLeaderboard, getFriendsLeaderboard, toggleLocation } from "../controllers/leaderboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/nearby", protect, getNearbyLeaderboard);
router.post("/location/toggle", protect, toggleLocation);
router.get("/friends", protect, getFriendsLeaderboard);
router.get("/", protect, getLeaderboard);

export default router;
