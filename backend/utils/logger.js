import winston from "winston";
import crypto from "crypto";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, requestId, ip, method, url, status, responseTime }) => {
  let log = `${timestamp} ${level}: `;
  if (requestId) log += `[reqId:${requestId}] `;
  if (method) log += `${method} ${url} ${status || ""} ${responseTime ? responseTime + "ms" : ""} `;
  if (ip) log += `[IP:${ip}] `;
  
  log += message;
  
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "development" ? colorize() : winston.format.uncolorize(),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export default logger;
