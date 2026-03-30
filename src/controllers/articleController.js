const Article = require('../models/Article');
const Category = require('../models/Category');

// Helper to resolve category name to ID
const resolveCategory = async (name) => {
  if (!name) return null;
  let cat = await Category.findOne({ name });
  if (!cat) {
    cat = await Category.create({ 
      name, 
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') 
    });
  }
  return cat._id;
};

const getArticles = async (req, res) => {
  try {
    const { status, categoryId, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (categoryId) query.categories = categoryId;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await Article.find(query).populate('categories').sort({ updatedAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('categories');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createArticle = async (req, res) => {
  try {
    const body = { ...req.body };
    
    // Support plural category names resolution
    if (body.categoryNames && Array.isArray(body.categoryNames)) {
      const catIds = await Promise.all(body.categoryNames.map(name => resolveCategory(name)));
      body.categories = catIds.filter(id => id);
    } else if (body.category) {
      const catId = await resolveCategory(body.category);
      if (catId) body.categories = [catId];
    }

    const article = new Article(body);
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const body = { ...req.body };
    
    // Support plural category names resolution
    if (body.categoryNames && Array.isArray(body.categoryNames)) {
      const catIds = await Promise.all(body.categoryNames.map(name => resolveCategory(name)));
      body.categories = catIds.filter(id => id);
    } else if (body.category) {
      const catId = await resolveCategory(body.category);
      if (catId) body.categories = [catId];
    }

    const article = await Article.findByIdAndUpdate(req.params.id, body, { new: true }).populate('categories');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const publishArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const draftArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, { status: 'draft' }, { new: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getArticleStats = async (req, res) => {
  try {
    const stats = await Article.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array → object
    const result = {
      all: 0,
      draft: 0,
      published: 0,
      review: 0
    };

    stats.forEach(item => {
      if (result.hasOwnProperty(item._id)) {
        result[item._id] = item.count;
      }
      result.all += item.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const triggerTrendFetch = async (req, res) => {
  try {
    const { runPipeline } = require('../services/orchestrator');

    // Run pipeline asynchronously — respond immediately with run ID
    const runId = `run_${Date.now()}`;
    
    const User = require('../models/User');
    const admin = await User.findOne({ role: 'admin' });
    const settings = admin?.settings || { publishMode: 'manual', sourceRegion: 'US' };

    // Fire and forget (don't await, so API responds fast)
    setImmediate(async () => {
      try {
        await runPipeline({ runId, settings });
      } catch (err) {
        console.error('[API] Pipeline error:', err.message);
      }
    });

    res.json({
      message: 'Agentic pipeline triggered successfully',
      runId,
      pipeline: 'TrendAgent → PlannerAgent → WriterAgent → EditorAgent → QAAgent → PublisherAgent',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLiveTrends = async (req, res) => {
  try {
    const { fetchRSSNews } = require('../services/rssService');
    const Article = require('../models/Article');
    const pipelineState = require('../config/pipelineState');
    
    const User = require('../models/User');
    const admin = await User.findOne({ role: 'admin' });
    const settings = admin?.settings || { sourceRegion: 'US' };
    
    const feed = await fetchRSSNews(settings.sourceRegion);
    if (!feed || feed.length === 0) {
      return res.json([]);
    }

    // Get topics from DB
    const existingSlugs = await Article.distinct('topic');
    const existing = new Set(existingSlugs);

    // Get topics currently in active/pending runs to prevent re-selection while gen is happening
    const activeRuns = pipelineState.getAllRuns();
    const inProgressTopics = new Set();
    
    activeRuns.forEach(run => {
      if (['running', 'paused'].includes(run.status)) {
        run.topics.forEach(t => {
          // Add both topic and slug to be safe
          inProgressTopics.add(t.topic);
          inProgressTopics.add(t.slug);
        });
      }
    });

    const trends = feed.map(item => {
      const slug = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const isAlreadyInDB = existing.has(slug);
      const isCurrentlyGenerating = inProgressTopics.has(item.title) || inProgressTopics.has(slug);

      return {
        ...item,
        // It's only "New" if it's not in DB AND not currently being worked on by agents
        isNew: !isAlreadyInDB && !isCurrentlyGenerating
      };
    });

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const triggerPipelineWithTopics = async (req, res) => {
  try {
    const { topics } = req.body;
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: 'No topics provided' });
    }

    const { runPipeline } = require('../services/orchestrator');
    const runId = `run_${Date.now()}`;
    
    setImmediate(async () => {
      try {
        await runPipeline({ runId, topics, skipTrend: true });
      } catch (err) {
        console.error('[API] Pipeline error:', err.message);
      }
    });

    res.json({
      message: `Agentic pipeline triggered for ${topics.length} topics`,
      runId,
      pipeline: 'PlannerAgent → WriterAgent → ImageAgent → EditorAgent → QAAgent → PublisherAgent',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const triggerPipelineSync = async (req, res) => {
  try {
    const { runPipeline } = require('../services/orchestrator');
    const report = await runPipeline();
    res.json({ message: 'Pipeline completed', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQueueStatus = async (req, res) => {
  try {
    // Legacy BullMQ queue status — keep for backward compat
    const { articleQueue } = require('../config/queue');
    if (!articleQueue) {
      return res.json([]); // Return empty array, not error, so frontend handles gracefully
    }

    const jobs = await articleQueue.getJobs(['completed', 'waiting', 'active', 'failed'], 0, 19, false);
    
    const jobStats = await Promise.all(jobs.map(async (job) => ({
      id: job.id,
      topic: job.data.topic,
      status: await job.getState(),
      progress: job.progress,
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failedReason: job.failedReason,
      articleId: job.returnvalue?.articleId
    })));

    res.json(jobStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  draftArticle,
  getArticleStats,
  getQueueStatus,
  triggerTrendFetch,
  triggerPipelineSync,
  getLiveTrends,
  triggerPipelineWithTopics,
};