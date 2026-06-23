import Redis from 'ioredis';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const createRedisClient = (name) => {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  client.on('error', (err) => {
    logger.error(`Redis (${name}) error:`, err);
  });

  client.on('connect', () => {
    logger.info(`Redis (${name}) connected to ${redisUrl}`);
  });

  return client;
};

// Create shared instances
export const redisClient = createRedisClient('default');
export const pubClient = createRedisClient('pub');
export const subClient = createRedisClient('sub');
