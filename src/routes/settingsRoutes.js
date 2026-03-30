const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.getSettings);
router.get('/next-job', settingsController.getNextJobTime);
router.post('/', settingsController.updateSettings);
router.post('/toggle-mode', settingsController.togglePublishMode);

module.exports = router;
