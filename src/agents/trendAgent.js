/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              TREND AGENT 🌐                                    ║
 * ║  Fetches trending topics from Google News RSS                   ║
 * ║  Returns structured { title, link, snippet, pubDate }          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
const { fetchRSSNews } = require('../services/rssService');
const Article = require('../models/Article');
const logger = require('../config/logger');

const trendAgent = async (ctx) => {
  const region = ctx.settings?.sourceRegion || 'US';
  logger.info(`[TrendAgent] 🌐 Fetching trending topics for ${region} from RSS...`);

  const feed = await fetchRSSNews(region);

  if (!feed || feed.length === 0) {
    logger.warn('[TrendAgent] No topics found from RSS. Pipeline halting.');
    return { ...ctx, topics: [], halt: true };
  }

  // Deduplicate: skip topics already in DB
  const existingSlugs = await Article.distinct('topic');
  const existing = new Set(existingSlugs);

  const fresh = feed.filter(item => {
    const slug = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return !existing.has(slug);
  });

  logger.info(`[TrendAgent] Found ${feed.length} topics, ${fresh.length} are new.`);

  // Slice based on user settings for automated runs (default 2)
  const max = ctx.settings?.maxArticlesPerRun || 2;
  const limited = fresh.slice(0, max);

  if (fresh.length > max) {
    logger.info(`[TrendAgent] ✂️ Capping ${fresh.length} fresh topics to ${max} per settings.`);
  }

  return {
    ...ctx,
    topics: limited,
    totalFetched: feed.length,
    totalNew: fresh.length,
  };
};

module.exports = trendAgent;
