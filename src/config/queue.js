const { Queue } = require('bullmq');
const redisConnection = require('./redis');

let articleQueue = null;

if (redisConnection) {
  articleQueue = new Queue('article-generation', {
    connection: redisConnection,
  });
}

module.exports = { articleQueue };
