/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         PIPELINE STATE MANAGER 🛰️                             ║
 * ║                                                              ║
 * ║  In-memory store for tracking active pipeline runs.          ║
 * ║  Supports per-run and per-topic cancel/pause signals.        ║
 * ║  Emits events for SSE streaming to the frontend.             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

// Active pipeline run registry
// Map<runId, RunState>
const runs = new Map();

const STAGES = ['pending', 'trending', 'planning', 'writing', 'imaging', 'editing', 'qa', 'publishing', 'done', 'failed', 'cancelled', 'skipped'];

/**
 * Create a new pipeline run entry.
 */
const createRun = (runId, topics = []) => {
  const run = {
    runId,
    status: 'running',  // running | paused | cancelled | completed
    startedAt: new Date().toISOString(),
    completedAt: null,
    topics: topics.map(t => ({
      topic: typeof t === 'string' ? t : t.title,
      slug: (typeof t === 'string' ? t : t.title).toLowerCase().replace(/[^a-z0-9]/g, '-'),
      status: 'pending',
      stage: 'Queued',
      startedAt: null,
      completedAt: null,
      articleId: null,
      qualityScore: null,
      error: null,
    })),
    summary: { total: topics.length, done: 0, failed: 0, cancelled: 0 },
  };

  runs.set(runId, run);
  _emit(runId, run);
  return run;
};

/**
 * Update a topic's stage/status within a run.
 */
const updateTopic = (runId, topicTitle, update) => {
  const run = runs.get(runId);
  if (!run) return;

  const topicEntry = run.topics.find(t => t.topic === topicTitle || t.slug === topicTitle);
  if (topicEntry) {
    Object.assign(topicEntry, update);
    if (update.status === 'done' || update.status === 'failed' || update.status === 'cancelled') {
      topicEntry.completedAt = new Date().toISOString();
    }
    if (update.status === 'trending') {
      topicEntry.startedAt = new Date().toISOString();
    }
  }

  // Update summary
  run.summary.done = run.topics.filter(t => t.status === 'done').length;
  run.summary.failed = run.topics.filter(t => t.status === 'failed').length;
  run.summary.cancelled = run.topics.filter(t => t.status === 'cancelled').length;

  _emit(runId, run);
};

/**
 * Update overall run status.
 */
const updateRun = (runId, update) => {
  const run = runs.get(runId);
  if (!run) return;

  Object.assign(run, update);
  if (update.status === 'completed' || update.status === 'cancelled') {
    run.completedAt = new Date().toISOString();
  }

  _emit(runId, run);
};

/**
 * Cancel an entire run (or specific topic if topicSlug provided).
 */
const cancelRun = (runId, topicSlug = null) => {
  const run = runs.get(runId);
  if (!run) return false;

  if (topicSlug) {
    const topic = run.topics.find(t => t.slug === topicSlug);
    if (topic && topic.status !== 'done') {
      topic.status = 'cancelled';
      topic.completedAt = new Date().toISOString();
      run.summary.cancelled++;
    }
  } else {
    run.status = 'cancelled';
    run.completedAt = new Date().toISOString();
    // Mark all non-done topics as cancelled
    run.topics.forEach(t => {
      if (t.status !== 'done') {
        t.status = 'cancelled';
        t.completedAt = new Date().toISOString();
      }
    });
    run.summary.cancelled = run.topics.filter(t => t.status === 'cancelled').length;
  }

  _emit(runId, run);
  return true;
};

/**
 * Pause/resume a run.
 */
const pauseRun = (runId) => {
  const run = runs.get(runId);
  if (!run) return false;
  if (run.status === 'running') run.status = 'paused';
  else if (run.status === 'paused') run.status = 'running';
  _emit(runId, run);
  return run.status;
};

/**
 * Check if a run (or topic) is cancelled.
 */
const isCancelled = (runId, topicSlug = null) => {
  const run = runs.get(runId);
  if (!run) return false;
  if (run.status === 'cancelled') return true;
  if (topicSlug) {
    const topic = run.topics.find(t => t.slug === topicSlug);
    return topic?.status === 'cancelled';
  }
  return false;
};

/**
 * Check if a run is paused. Wait until resumed (polling).
 */
const waitIfPaused = async (runId, pollMs = 500) => {
  const run = runs.get(runId);
  if (!run) return;
  while (run.status === 'paused') {
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
};

/**
 * Get run state.
 */
const getRun = (runId) => runs.get(runId) || null;

/**
 * Get all active runs (not completed more than 10 min ago).
 */
const getAllRuns = () => {
  const now = Date.now();
  const result = [];
  for (const [runId, run] of runs.entries()) {
    // Auto-clean completed runs older than 30 min
    if (run.completedAt && (now - new Date(run.completedAt).getTime()) > 30 * 60 * 1000) {
      runs.delete(runId);
      continue;
    }
    result.push(run);
  }
  return result;
};

/**
 * Emit state change for SSE subscribers.
 */
const _emit = (runId, run) => {
  emitter.emit('update', { runId, run: JSON.parse(JSON.stringify(run)) });
};

/**
 * Subscribe to state changes (for SSE).
 */
const subscribe = (callback) => {
  emitter.on('update', callback);
  return () => emitter.off('update', callback);
};

module.exports = {
  createRun,
  updateTopic,
  updateRun,
  cancelRun,
  pauseRun,
  isCancelled,
  waitIfPaused,
  getRun,
  getAllRuns,
  subscribe,
};
