const Parser = require('rss-parser');
const parser = new Parser();

const fetchRSSNews = async (region = 'US') => {
  const regionMap = {
    'US': 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    'UK': 'https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en',
    'CA': 'https://news.google.com/rss?hl=en-CA&gl=CA&ceid=CA:en',
    'IN': 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    'GLOBAL': 'https://news.google.com/rss'
  };

  const url = regionMap[region] || regionMap['US'];

  try {
    const feed = await parser.parseURL(url);
    // Return top 20 items
    return feed.items.slice(0, 20).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet
    }));
  } catch (error) {
    console.error(`Error fetching Google News RSS for ${region}:`, error.message);
    return [];
  }
};

module.exports = {
  fetchRSSNews
};
