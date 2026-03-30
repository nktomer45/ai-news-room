const { fetchRSSNews } = require('./rssService');
require('dotenv').config();

const fetchTrendingTopics = async () => {
  try {
    const rssNews = await fetchRSSNews();
    if (rssNews && rssNews.length > 0) {
      return rssNews.map(item => item.title);
    }
    
    // Fallback if RSS fails
    console.warn('RSS fetch failed. Returning empty topics array.');
    return [];
  } catch (error) {
    console.error('Trend fetching failed:', error.message);
    return [];
  }
};

module.exports = { fetchTrendingTopics };
