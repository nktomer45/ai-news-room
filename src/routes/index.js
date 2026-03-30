const express = require('express');
const router = express.Router();

const articleRoutes = require('./articleRoutes');
const settingsRoutes = require('./settingsRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const authMiddleware = require('../middleware/authMiddleware');

// Global / Common Routes
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: "server is working" });
});

// Auth Routes
router.use('/api/auth', authRoutes);

// Feature Routes
router.use('/api/categories', categoryRoutes);

// Pipeline (stream is public for SSE; cancel/pause are protected)
router.use('/api/pipeline', pipelineRoutes);

// Feature Routes (Protected)
router.use('/api/articles', authMiddleware, articleRoutes);
router.use('/api/settings', authMiddleware, settingsRoutes);

module.exports = router;
