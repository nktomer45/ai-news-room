/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              QA AGENT ✅                                       ║
 * ║  Final gatekeeper: validates completeness, SEO, length         ║
 * ║  Implements retry loop for failed articles (max 2 retries)     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
const logger = require('../config/logger');
const writerAgent = require('./writerAgent');
const editorAgent = require('./editorAgent');

const MAX_RETRIES = 2;

// Minimum quality thresholds
const QA_RULES = {
  minTitleLength: 20,
  maxTitleLength: 120,
  minSummaryLength: 40,
  minContentLength: 300,
  minQualityScore: 60,
  requiredTags: 1,
};

const runQACheck = (article) => {
  const issues = [];

  if (!article.title || article.title.length < QA_RULES.minTitleLength) {
    issues.push(`Title too short (min ${QA_RULES.minTitleLength} chars)`);
  }
  if (article.title && article.title.length > QA_RULES.maxTitleLength) {
    issues.push(`Title too long (max ${QA_RULES.maxTitleLength} chars)`);
  }
  if (!article.summary || article.summary.length < QA_RULES.minSummaryLength) {
    issues.push(`Summary too short (min ${QA_RULES.minSummaryLength} chars)`);
  }
  if (!article.content || article.content.length < QA_RULES.minContentLength) {
    issues.push(`Content too short (min ${QA_RULES.minContentLength} chars)`);
  }
  if (!article.tags || article.tags.length < QA_RULES.requiredTags) {
    issues.push('No tags provided');
  }
  if (article.qualityScore !== undefined && article.qualityScore < QA_RULES.minQualityScore) {
    issues.push(`Quality score ${article.qualityScore} below threshold ${QA_RULES.minQualityScore}`);
  }

  return { passed: issues.length === 0, issues };
};

const qaAgent = async (ctx) => {
  const { edited, plans } = ctx;

  if (!edited || edited.length === 0) {
    logger.warn('[QAAgent] No edited articles to QA.');
    return { ...ctx, approved: [], failed: [] };
  }

  logger.info(`[QAAgent] ✅ Running QA on ${edited.length} articles...`);

  const approved = [];
  const failed = [];

  for (const article of edited) {
    let current = article;
    let attempt = 0;
    let passed = false;

    while (attempt <= MAX_RETRIES) {
      const { passed: ok, issues } = runQACheck(current);

      if (ok) {
        passed = true;
        logger.info(`[QAAgent] ✅ "${current.title}" passed QA (attempt ${attempt + 1}).`);
        break;
      }

      logger.warn(`[QAAgent] ❌ "${current.title}" failed QA (attempt ${attempt + 1}): ${issues.join(', ')}`);

      if (attempt < MAX_RETRIES) {
        logger.info(`[QAAgent] 🔄 Retrying Writer + Editor for "${current.plan?.topic}"...`);
        try {
          // Retry: re-run writer + editor for this single plan
          const retryCtx = await writerAgent({ plans: [current.plan] });
          const editRetryCtx = await editorAgent({ drafts: retryCtx.drafts });
          if (editRetryCtx.edited.length > 0) {
            current = editRetryCtx.edited[0];
          }
        } catch (err) {
          logger.error(`[QAAgent] Retry failed: ${err.message}`);
        }
      }

      attempt++;
    }

    if (passed) {
      approved.push({ ...current, qaAttempts: attempt + 1 });
    } else {
      failed.push({ topic: current.plan?.topic, issues: runQACheck(current).issues });
    }
  }

  logger.info(`[QAAgent] Approved: ${approved.length}, Failed: ${failed.length}`);
  return { ...ctx, approved, failedQA: failed };
};

module.exports = qaAgent;
