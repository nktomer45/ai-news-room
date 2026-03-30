const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

router.get('/', articleController.getArticles);
router.get('/stats', articleController.getArticleStats);
router.get('/queue-status', articleController.getQueueStatus);
router.get('/live-trends', articleController.getLiveTrends);
router.post('/trigger-fetch', articleController.triggerTrendFetch);
router.post('/trigger-pipeline-sync', articleController.triggerPipelineSync);
router.post('/trigger-pipeline-with-topics', articleController.triggerPipelineWithTopics);
router.get('/:id', articleController.getArticleById);
router.post('/', articleController.createArticle);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.patch('/:id/publish', articleController.publishArticle);
router.patch('/:id/draft', articleController.draftArticle);

module.exports = router;
