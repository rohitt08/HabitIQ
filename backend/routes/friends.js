import express from "express";
import { getFriends, addFriend, removeFriend, searchUser } from "../controllers/friendsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getFriends);
router.get("/search", protect, searchUser);
router.post("/add", protect, addFriend);
router.delete("/remove/:id", protect, removeFriend);

export default router;
