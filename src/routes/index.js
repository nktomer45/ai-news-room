const express = require('express');
const router = express.Router();

const articleRoutes = require('./articleRoutes');
const settingsRoutes = require('./settingsRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const authMiddleware = require('../middleware/authMiddleware');

// Global / Common Routes
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: "server is working" });
});

// Auth Routes
router.use('/auth', authRoutes);

// Feature Routes
router.use('/categories', categoryRoutes);

// Pipeline (stream is public for SSE; cancel/pause are protected)
router.use('/pipeline', pipelineRoutes);

// Feature Routes (Protected)
router.use('/articles', authMiddleware, articleRoutes);
router.use('/settings', authMiddleware, settingsRoutes);

module.exports = router;
