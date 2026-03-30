const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const { generateArticle } = require('../services/aiService');
const Article = require('../models/Article');

let articleWorker = null;

if (redisConnection) {
  articleWorker = new Worker('article-generation', async (job) => {
    const { topic } = job.data;
    console.log(`Processing article for topic: ${topic}`);

    try {
      // Check for duplicate topic
      const existing = await Article.findOne({ topic });
      if (existing) {
        console.log(`Topic "${topic}" already exists. Skipping.`);
        return;
      }

      const aiData = await generateArticle(topic);
      const User = require('../models/User');
      const Category = require('../models/Category');

      // Map AI string category to Category document
      let categoryId = null;
      if (aiData.category) {
        const slug = aiData.category.toLowerCase().replace(/ /g, '-');
        let category = await Category.findOne({ slug });
        if (!category) {
          category = new Category({ name: aiData.category, slug });
          await category.save();
        }
        categoryId = category._id;
      }

      // Get publish mode from any admin (using first found admin as global state fallback)
      const admin = await User.findOne({ role: 'admin' });
      const isAuto = admin ? admin.settings.publishMode === 'auto' : false;

      const articleData = { ...aiData };
      delete articleData.category; // Remove the string version

      const article = new Article({
        ...articleData,
        topic,
        categories: categoryId ? [categoryId] : [],
        status: isAuto ? 'published' : 'draft',
        isAuto: isAuto
      });

      await article.save();
      console.log(`Successfully generated and saved article for topic: ${topic}`);
      return { articleId: article._id };
    } catch (error) {
      console.error(`Failed to process job for topic: ${topic}`, error.message);
      throw error;
    }
  }, {
    connection: redisConnection,
  });

  articleWorker.on('completed', (job) => {
    console.log(`Job completed: ${job.id}`);
  });

  articleWorker.on('failed', (job, err) => {
    console.error(`Job failed: ${job.id} with error ${err.message}`);
  });
}

module.exports = articleWorker;
