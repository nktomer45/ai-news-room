const IORedis = require('ioredis');
const config = require('./config');

let redisConnection = null;

if (config.redis.enabled) {
  redisConnection = new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redisConnection.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
  });
} else {
  console.warn('Redis is disabled in config. Background jobs will not run.');
}

module.exports = redisConnection;
