const IORedis = require('ioredis');
const config = require('./config');

let redisConnection = null;

if (config.redis.enabled) {
  if (config.redis.url) {
    const isTls = config.redis.url.startsWith('rediss://');
    redisConnection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(isTls && {
        tls: {
          rejectUnauthorized: false
        }
      })
    });
  } else {
    redisConnection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  redisConnection.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
  });
} else {
  console.warn('Redis is disabled in config. Background jobs will not run.');
}

module.exports = redisConnection;
