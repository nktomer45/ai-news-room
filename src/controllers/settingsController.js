const User = require('../models/User');
const cronJobs = require('../jobs/cronJobs');

const getSettings = async (req, res) => {
  try {
    res.json(req.user.settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextJobTime = async (req, res) => {
  try {
    const nextRun = cronJobs.getNextRun();
    res.json({ nextRun });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePublishMode = async (req, res) => {
  try {
    const { mode } = req.body; // 'manual' or 'auto'
    if (!['manual', 'auto'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode' });
    }

    const user = await User.findById(req.user.id);
    user.settings.publishMode = mode;
    await user.save();
    
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { 
      publishMode, 
      contentQuality, 
      sourceRegion, 
      fetchInterval, 
      maxArticlesPerRun,
      duplicateDetection,
    } = req.body;

    const oldInterval = user.settings.fetchInterval;

    if (publishMode) user.settings.publishMode = publishMode;
    if (contentQuality) user.settings.contentQuality = contentQuality;
    if (sourceRegion) user.settings.sourceRegion = sourceRegion;
    if (fetchInterval) user.settings.fetchInterval = fetchInterval;
    if (maxArticlesPerRun) user.settings.maxArticlesPerRun = maxArticlesPerRun;
    if (typeof duplicateDetection !== 'undefined') user.settings.duplicateDetection = duplicateDetection;

    await user.save();

    // Trigger cron reschedule if interval changed
    // Trigger cron reschedule if mode or interval changed
    if (publishMode || (fetchInterval && fetchInterval !== oldInterval)) {
      cronJobs.reschedule();
    }

    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  getNextJobTime,
  togglePublishMode,
  updateSettings
};
