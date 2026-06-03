import logger from "../utils/logger.js";
import crypto from "crypto";

export const requestLogger = (req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.connection.remoteAddress;
    
    logger.info({
      message: "HTTP Request",
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: duration,
      ip: ip,
    });
  });

  next();
};
