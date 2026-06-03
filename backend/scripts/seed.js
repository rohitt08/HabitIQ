import "dotenv/config";
import mongoose from "mongoose";
import { format, subDays } from "date-fns";
import { connectDB } from "../config/db.js";

import User from "../models/user.js";
import Habit from "../models/habit.js";
import HabitLog from "../models/habitlog.js";
import AIInsight from "../models/AIInsight.js";

const EMAIL = "demo@gmail.com";
const PASSWORD = "password123";
const NAME = "Demo Boy";

const HABITS = [
    {
        name: "Wake up by 6 AM",
        icon: "🌄",
        color: "#FFD700", // gold
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        description: "Wake up early to start the day refreshed."
    },
    {
        name: "15 minute walk",
        icon: "🚶",
        color: "#2ecc71",
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        description: "A brisk walk to boost energy."
    },
    {
        name: "Read for 20 minutes",
        icon: "📚",
        color: "#3498db",
        category: "Learning",
        frequency: "daily",
        targetDays: 7,
        description: "Read at least 20 pages of a book."
    },
    {
        name: "No phone 1 hour before bed",
        icon: "📵",
        color: "#e74c3c",
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        description: "Wind down screen-free for better sleep."
    },
    {
        name: "Drink 2L of water",
        icon: "💧",
        color: "#95a5a6",
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        description: "Stay hydrated throughout the day."
    },
    {
        name: "Journal for 10 minutes",
        icon: "📝",
        color: "#f39c12",
        category: "Mindfulness",
        frequency: "daily",
        targetDays: 5,
        description: "Write down your thoughts and feelings."
    },
    {
        name: "Learn one new word",
        icon: "📖",
        color: "#16a085",
        category: "Learning",
        frequency: "daily",
        targetDays: 7,
        description: "Expand your vocabulary every day."
    },
    {
        name: "Meditate for 10 minutes",
        icon: "🧘",
        color: "#8e44ad",
        category: "Mindfulness",
        frequency: "daily",
        targetDays: 5,
        description: "Clear your mind and focus on the present."
    },
    {
        name: "Stretch for 5 minutes",
        icon: "🤸",
        color: "#e67e22",
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        description: "Light stretching to ease muscle tension."
    },
    {
        name: "Plan tomorrow's tasks",
        icon: "📋",
        color: "#2980b9",
        category: "Productivity",
        frequency: "daily",
        targetDays: 5,
        description: "Write down your top 3 priorities for the next day."
    },
    {
        name: "Tidy workspace for 10 minutes",
        icon: "🧹",
        color: "#f1c40f",
        category: "Productivity",
        frequency: "daily",
        targetDays: 5,
        description: "Keep your desk organized for better focus."
    },
    {
        name: "Eat a healthy breakfast",
        icon: "🍳",
        color: "#e67e22",
        category: "Health",
        frequency: "daily",
        targetDays: 5,
        description: "Fuel your body with a nutritious start."
    }
];