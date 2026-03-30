/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              PUBLISHER AGENT 🚀                                ║
 * ║  Takes QA-approved articles and persists them to MongoDB       ║
 * ║  Handles category resolution, publish mode (auto/draft)        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
const Article = require('../models/Article');
const Category = require('../models/Category');
const User = require('../models/User');
const logger = require('../config/logger');

// Resolve or auto-create a category by name
const resolveCategory = async (name) => {
  if (!name) return null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  let cat = await Category.findOne({ slug });
  if (!cat) {
    cat = await Category.create({ name, slug });
    logger.info(`[PublisherAgent] Created new category: "${name}"`);
  }
  return cat._id;
};

const publisherAgent = async (ctx) => {
  const { approved } = ctx;

  if (!approved || approved.length === 0) {
    logger.warn('[PublisherAgent] No approved articles to publish.');
    return { ...ctx, published: [], publishedIds: [] };
  }

  logger.info(`[PublisherAgent] 🚀 Publishing ${approved.length} articles...`);

  // Determine publish mode from admin settings
  let isAuto = false;
  try {
    const admin = await User.findOne({ role: 'admin' });
    isAuto = admin?.settings?.publishMode === 'auto';
  } catch (err) {
    logger.warn('[PublisherAgent] Could not fetch admin settings, defaulting to draft mode.');
  }

  const publishedArticles = [];

  for (const article of approved) {
    try {
      const slug = article.plan?.slug || article.topic || article.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
      // Resolve category to ObjectId
      const categoryName = article.plan?.category || article.category || 'Tech';
      const categoryId = await resolveCategory(categoryName);

      const updateData = {
        title: article.title,
        summary: article.summary,
        content: article.content,
        topic: slug,
        tags: article.tags || [],
        imageUrl: article.imageUrl || '',
        status: isAuto ? 'published' : 'draft',
        isAuto,
        // Store agent metadata for future reference
        agentMeta: {
          qualityScore: article.qualityScore,
          editorNotes: article.editorNotes,
          qaAttempts: article.qaAttempts || 1,
          angle: article.plan?.angle,
          targetAudience: article.plan?.targetAudience,
          tone: article.plan?.tone,
        }
      };

      if (categoryId) {
        updateData.categories = [categoryId];
      }

      // Upsert: Create if doesn't exist, Update if it does
      const doc = await Article.findOneAndUpdate(
        { topic: slug },
        { $set: updateData },
        { new: true, upsert: true }
      );

      logger.info(`[PublisherAgent] ✅ Saved/Updated "${article.title}" as ${doc.status}`);
      publishedArticles.push(doc);

    } catch (err) {
      logger.error(`[PublisherAgent] Failed to save "${article.title}": ${err.message}`);
    }
  }

  logger.info(`[PublisherAgent] 🚀 Done. Published ${publishedArticles.length} articles.`);

  return {
    ...ctx,
    published: publishedArticles,
    publishedIds: publishedArticles.map(a => a._id),
  };
};

module.exports = publisherAgent;
