/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          AI NEWSROOM — AGENTIC ORCHESTRATOR 🛰️                       ║
 * ║                                                                      ║
 * ║  LangChain-style multi-agent pipeline with real-time state tracking: ║
 * ║  CRON → TrendAgent → PlannerAgent → WriterAgent → ImageAgent         ║
 * ║       → EditorAgent → QAAgent (retry loop) → PublisherAgent          ║
 * ║                                                                      ║
 * ║  Features:                                                           ║
 * ║  • Per-topic cancel (user can kill individual articles mid-gen)       ║
 * ║  • Run-level pause/resume                                            ║
 * ║  • SSE state emission at every stage for live frontend tracking      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

const logger = require('../config/logger');
const pipelineState = require('../config/pipelineState');

const trendAgent     = require('../agents/trendAgent');
const plannerAgent   = require('../agents/plannerAgent');
const writerAgent    = require('../agents/writerAgent');
const imageAgent     = require('../agents/imageAgent');
const editorAgent    = require('../agents/editorAgent');
const qaAgent        = require('../agents/qaAgent');
const publisherAgent = require('../agents/publisherAgent');

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Run a full-batch named pipeline stage (used for trend/plan phases).
 */
const runStage = async (name, agentFn, ctx) => {
  const start = Date.now();
  logger.info(`\n${'━'.repeat(60)}`);
  logger.info(`[Orchestrator] ▶ Stage: ${name}`);
  logger.info(`${'━'.repeat(60)}`);

  try {
    const result = await agentFn(ctx);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    logger.info(`[Orchestrator] ✅ ${name} completed in ${elapsed}s`);
    return result;
  } catch (err) {
    logger.error(`[Orchestrator] ❌ ${name} FAILED: ${err.message}`);
    return { ...ctx, [`${name}Error`]: err.message };
  }
};

/**
 * Process a single topic through per-article Gemini agents (Write → Image → Edit → QA).
 * Checks cancel/pause signals between each stage.
 */
const processSingleTopic = async (plan, runId) => {
  const { topic, slug } = plan;

  // Helper: check if cancelled before each sub-stage
  const checkSignal = async () => {
    await pipelineState.waitIfPaused(runId);
    return pipelineState.isCancelled(runId, slug);
  };

  // ── Writing ──
  if (await checkSignal()) {
    pipelineState.updateTopic(runId, topic, { status: 'cancelled', stage: 'Cancelled by user' });
    return null;
  }

  pipelineState.updateTopic(runId, topic, { status: 'writing', stage: 'WriterAgent ✍️' });
  const writeCtx = await writerAgent({ plans: [plan] });
  const draft = writeCtx.drafts?.[0];
  if (!draft) {
    pipelineState.updateTopic(runId, topic, { status: 'failed', stage: 'WriterAgent', error: 'No draft produced' });
    return null;
  }

  // ── Image Generation ──
  if (await checkSignal()) {
    pipelineState.updateTopic(runId, topic, { status: 'cancelled', stage: 'Cancelled by user' });
    return null;
  }

  pipelineState.updateTopic(runId, topic, { status: 'imaging', stage: 'ImageAgent 🖼️' });
  const imgCtx = await imageAgent({ drafts: [draft] });
  const draftWithImage = imgCtx.drafts?.[0] || draft;

  // ── Editing ──
  if (await checkSignal()) {
    pipelineState.updateTopic(runId, topic, { status: 'cancelled', stage: 'Cancelled by user' });
    return null;
  }

  pipelineState.updateTopic(runId, topic, { status: 'editing', stage: 'EditorAgent 📝' });
  const editCtx = await editorAgent({ drafts: [draftWithImage] });
  const edited = editCtx.edited?.[0];
  if (!edited) {
    pipelineState.updateTopic(runId, topic, { status: 'failed', stage: 'EditorAgent', error: 'Rejected by editor' });
    return null;
  }

  // ── QA ──
  if (await checkSignal()) {
    pipelineState.updateTopic(runId, topic, { status: 'cancelled', stage: 'Cancelled by user' });
    return null;
  }

  pipelineState.updateTopic(runId, topic, { status: 'qa', stage: 'QAAgent ✅' });
  const qaCtx = await qaAgent({ edited: [edited], plans: [plan] });
  const approved = qaCtx.approved?.[0];
  if (!approved) {
    const issues = qaCtx.failedQA?.[0]?.issues?.join(', ') || 'QA failed';
    pipelineState.updateTopic(runId, topic, { status: 'failed', stage: 'QAAgent', error: issues });
    return null;
  }

  // ── Publishing ──
  if (await checkSignal()) {
    pipelineState.updateTopic(runId, topic, { status: 'cancelled', stage: 'Cancelled by user' });
    return null;
  }

  pipelineState.updateTopic(runId, topic, { status: 'publishing', stage: 'PublisherAgent 🚀' });
  const pubCtx = await publisherAgent({ approved: [approved] });
  const published = pubCtx.published?.[0];

  if (published) {
    pipelineState.updateTopic(runId, topic, {
      status: 'done',
      stage: 'Published ✅',
      articleId: published._id?.toString(),
      qualityScore: approved.qualityScore,
    });
    return published;
  } else {
    pipelineState.updateTopic(runId, topic, { status: 'failed', stage: 'PublisherAgent', error: 'Save failed' });
    return null;
  }
};

/**
 * Main pipeline runner.
 */
const runPipeline = async (initialCtx = {}) => {
  const pipelineStart = Date.now();
  const runId = initialCtx.runId || `run_${Date.now()}`;

  logger.info(`\n${'═'.repeat(60)}`);
  logger.info(`[Orchestrator] 🚀 PIPELINE START — Run ID: ${runId}`);
  logger.info(`${'═'.repeat(60)}\n`);

  let ctx = {
    runId,
    startedAt: new Date().toISOString(),
    topics: [],
    plans: [],
    ...initialCtx,
  };

  // ─── Stage 0: Context Initialization (Fresh Settings) ───
  if (!ctx.settings) {
    const User = require('../models/User');
    const admin = await User.findOne({ role: 'admin' });
    ctx.settings = admin?.settings || { publishMode: 'manual', sourceRegion: 'US' };
  }

  // ─── Stage 1: Trend Agent ───
  if (!ctx.skipTrend) {
    ctx = await runStage('TrendAgent 🌐', trendAgent, ctx);
    if (ctx.halt || !ctx.topics?.length) {
      logger.warn('[Orchestrator] No new topics found. Halting.');
      return buildReport(ctx, pipelineStart);
    }

    // Manual Mode check: if manual, we just fetch topics and STOP.
    // The user will pick from the list on the frontend.
    if (ctx.settings?.publishMode === 'manual') {
      logger.info('[Orchestrator] ✋ Manual Review Mode active. Halting after Fetch stage.');
      return buildReport(ctx, pipelineStart);
    }
  }

  // Register the run in state store NOW that we have topics
  pipelineState.createRun(runId, ctx.topics);
  pipelineState.updateRun(runId, { status: 'running' });

  // ─── Stage 2: Planner Agent ───
  pipelineState.updateRun(runId, { currentStage: 'PlannerAgent 🧠' });
  ctx = await runStage('PlannerAgent 🧠', plannerAgent, ctx);

  if (!ctx.plans?.length) {
    pipelineState.updateRun(runId, { status: 'completed' });
    return buildReport(ctx, pipelineStart);
  }

  // Update all topic slugs now that plans are ready
  ctx.plans.forEach(plan => {
    pipelineState.updateTopic(runId, plan.topic, { status: 'planning', stage: 'Planned', slug: plan.slug });
  });

  // ─── Stages 3-7: Process each topic SERIALLY with cancel/pause signals ───
  const publishedArticles = [];

  for (const plan of ctx.plans) {
    // Check run-level cancellation
    if (pipelineState.isCancelled(runId)) {
      logger.warn(`[Orchestrator] Run ${runId} was cancelled.`);
      break;
    }

    logger.info(`\n[Orchestrator] 📰 Processing: "${plan.topic}"`);
    const result = await processSingleTopic(plan, runId);
    if (result) publishedArticles.push(result);
  }

  // Mark run as completed
  pipelineState.updateRun(runId, {
    status: pipelineState.isCancelled(runId) ? 'cancelled' : 'completed',
    currentStage: 'Finished',
  });

  ctx.published = publishedArticles;
  ctx.publishedIds = publishedArticles.map(a => a._id?.toString());

  return buildReport(ctx, pipelineStart);
};

/**
 * Build a structured pipeline report.
 */
const buildReport = (ctx, startTime) => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  const report = {
    runId: ctx.runId,
    startedAt: ctx.startedAt,
    durationSeconds: parseFloat(elapsed),
    stages: {
      trendsFound:  ctx.topics?.length || 0,
      trendsNew:    ctx.totalNew || 0,
      planned:      ctx.plans?.length || 0,
      published:    ctx.published?.length || 0,
    },
    publishedIds: ctx.publishedIds || [],
  };

  logger.info(`\n${'═'.repeat(60)}`);
  logger.info(`[Orchestrator] 🏁 PIPELINE COMPLETE — ${elapsed}s`);
  logger.info(JSON.stringify(report.stages, null, 2));
  logger.info(`${'═'.repeat(60)}\n`);

  return report;
};

module.exports = { runPipeline };
