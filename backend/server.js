import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";
import leaderboardRoutes from "./routes/leaderboard.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import logger from "./utils/logger.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        // Allow requests with no origin (curl, same-origin, server-to-server)
        if (!origin) return cb(null, true);

        // Allow any localhost / 127.0.0.1 origin in development
        if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
        }

        // Allow anything explicitly listed in CLIENT_URL (comma-separated)
        if (allowedOrigins.includes(origin)) return cb(null, true);

        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.set("trust proxy", 1); // Trust first proxy for correct IP identification behind reverse proxies
app.use(helmet());
app.use(compression());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Limit each IP to 500 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(globalLimiter);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(requestLogger);

app.get("/api/health", (req, res) =>
    res.json({ status: "ok", time: new Date().toISOString() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use(notFound);
app.use(errorHandler);

import { startCronJobs } from "./services/cronService.js";

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    startCronJobs();
    app.listen(PORT, "0.0.0.0", () => {
        logger.info(`Server running on http://localhost:${PORT}`);
    });
});