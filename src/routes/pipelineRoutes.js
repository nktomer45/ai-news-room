/**
 * Pipeline Routes — Real-time tracking, cancel, and pause API
 */
const express = require('express');
const router = express.Router();
const pipelineState = require('../config/pipelineState');
const logger = require('../config/logger');

/**
 * GET /api/pipeline/status
 * Returns all active pipeline runs.
 */
router.get('/status', (req, res) => {
  const runs = pipelineState.getAllRuns();
  res.json(runs);
});

/**
 * GET /api/pipeline/status/:runId
 * Returns state for a specific run.
 */
router.get('/status/:runId', (req, res) => {
  const run = pipelineState.getRun(req.params.runId);
  if (!run) return res.status(404).json({ message: 'Run not found' });
  res.json(run);
});

/**
 * GET /api/pipeline/stream
 * Server-Sent Events endpoint — pushes live state updates.
 * Clients connect once and receive updates as articles progress.
 */
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send current state immediately on connect
  const runs = pipelineState.getAllRuns();
  res.write(`data: ${JSON.stringify({ type: 'init', runs })}\n\n`);

  // Subscribe to future updates
  const unsubscribe = pipelineState.subscribe(({ runId, run }) => {
    res.write(`data: ${JSON.stringify({ type: 'update', runId, run })}\n\n`);
  });

  // Heartbeat every 15s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    unsubscribe();
    clearInterval(heartbeat);
    logger.info('[SSE] Client disconnected from pipeline stream.');
  });
});

/**
 * POST /api/pipeline/cancel/:runId
 * Cancel an entire pipeline run.
 */
router.post('/cancel/:runId', (req, res) => {
  const success = pipelineState.cancelRun(req.params.runId);
  if (!success) return res.status(404).json({ message: 'Run not found' });
  logger.info(`[Pipeline] Run ${req.params.runId} cancelled by user.`);
  res.json({ message: 'Pipeline run cancelled', runId: req.params.runId });
});

/**
 * POST /api/pipeline/cancel/:runId/topic/:topicSlug
 * Cancel a specific article within a run.
 */
router.post('/cancel/:runId/topic/:topicSlug', (req, res) => {
  const success = pipelineState.cancelRun(req.params.runId, req.params.topicSlug);
  if (!success) return res.status(404).json({ message: 'Run or topic not found' });
  logger.info(`[Pipeline] Topic ${req.params.topicSlug} cancelled in run ${req.params.runId}.`);
  res.json({ message: 'Topic cancelled', topic: req.params.topicSlug });
});

/**
 * POST /api/pipeline/pause/:runId
 * Toggle pause/resume on a pipeline run.
 */
router.post('/pause/:runId', (req, res) => {
  const newStatus = pipelineState.pauseRun(req.params.runId);
  if (!newStatus) return res.status(404).json({ message: 'Run not found' });
  logger.info(`[Pipeline] Run ${req.params.runId} ${newStatus}.`);
  res.json({ message: `Pipeline ${newStatus}`, status: newStatus, runId: req.params.runId });
});

module.exports = router;
