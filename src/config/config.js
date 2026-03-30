require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI,
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
  openaiApiKey: process.env.OPENAI_API_KEY,
  newsApiKey: process.env.NEWS_API_KEY,
  publishMode: process.env.PUBLISH_MODE || 'manual',
  isDev: process.env.NODE_ENV !== 'production',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret'
};

module.exports = config;
