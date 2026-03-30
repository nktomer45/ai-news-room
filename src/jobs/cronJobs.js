/**
 * Cron Jobs — Runs the full agentic pipeline on schedule
 * CRON → Orchestrator → [TrendAgent → PlannerAgent → WriterAgent → EditorAgent → QAAgent → PublisherAgent]
 */
const cron = require('node-cron');
const { runPipeline } = require('../services/orchestrator');
const User = require('../models/User');
const logger = require('../config/logger');

let currentTask = null;
let nextRunTime = null;

const getCronExpression = (interval) => {
  switch (interval) {
    case '5m':  return '*/5 * * * *';
    case '10m': return '*/10 * * * *';
    case '15m': return '*/15 * * * *';
    case '30m': return '*/30 * * * *';
    case '1h':  return '0 * * * *';
    case '6h':  return '0 */6 * * *';
    case '12h': return '0 */12 * * *';
    case '24h': return '0 0 * * *';
    default:    return '0 * * * *';
  }
};

const updateNextRunTime = (interval) => {
  const now = new Date();
  let next = new Date(now);
  
  if (interval === '5m') next.setMinutes(Math.ceil((now.getMinutes() + 1) / 5) * 5);
  else if (interval === '10m') next.setMinutes(Math.ceil((now.getMinutes() + 1) / 10) * 10);
  else if (interval === '15m') next.setMinutes(Math.ceil((now.getMinutes() + 1) / 15) * 15);
  else if (interval === '30m') next.setMinutes(Math.ceil((now.getMinutes() + 1) / 30) * 30);
  else {
    next.setHours(now.getHours() + 1);
    next.setMinutes(0);
  }
  next.setSeconds(0);
  nextRunTime = next.toISOString();
};

const setupCronJobs = async (runImmediately = true) => {
  const admin = await User.findOne({ role: 'admin' });
  const settings = admin?.settings || { publishMode: 'manual', sourceRegion: 'US' };
  const interval = settings.fetchInterval || '1h';

  if (settings.publishMode === 'manual') {
    if (currentTask) currentTask.stop();
    nextRunTime = null;
    logger.info('[CRON] ⏸️ Manual Mode active. Automated scheduling paused.');
    return;
  }
  
  const runJob = async () => {
    logger.info('[CRON] ⏰ Checking for new topics...');
    try {
      const freshAdmin = await User.findOne({ role: 'admin' });
      const currentSettings = freshAdmin?.settings || { publishMode: 'manual', sourceRegion: 'US' };
      
      // Safety check: if mode switched to manual while job was waiting in cron, don't run.
      if (currentSettings.publishMode === 'manual') {
        logger.info('[CRON] 🛑 Mode shifted to MANUAL. Skipping scheduled job.');
        if (currentTask) currentTask.stop();
        nextRunTime = null;
        return;
      }

      logger.info(`[CRON] Mode: ${currentSettings.publishMode.toUpperCase()} | Region: ${currentSettings.sourceRegion}`);
      const report = await runPipeline({ settings: currentSettings });
      
      logger.info(`[CRON] ✅ Auto-published: ${report.stages.published}/${report.stages.planned} articles.`);
      
      // After job finishes, recalculate next run
      updateNextRunTime(currentSettings.fetchInterval);
    } catch (err) {
      logger.error(`[CRON] ❌ Pipeline failed: ${err.message}`);
    }
  };

  // Run only on cold start, not on reschedule
  if (runImmediately) {
    runJob();
  }
  
  updateNextRunTime(interval);

  // Initial schedule
  const expression = getCronExpression(interval);
  currentTask = cron.schedule(expression, runJob);
  logger.info(`[CRON] initialized with ${interval} interval (${expression})`);
};

const getNextRun = () => nextRunTime;

const reschedule = async () => {
  if (currentTask) {
    currentTask.stop();
  }
  logger.info('[CRON] Re-scheduling due to settings change (waiting for next interval)...');
  await setupCronJobs(false);
};

module.exports = { setupCronJobs, getNextRun, reschedule };