require('dotenv').config();

const FirecrawlApp = require('@mendable/firecrawl-js').default;

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const scrapeUrl = async (url, options = {}) => {
  try {
    const scrapeResult = await app.scrape(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      ...options
    });
    return scrapeResult;
  } catch (error) {
    throw new Error(`Scraping failed: ${error.message}`);
  }
};

const crawlUrl = async (url, options = {}) => {
  try {
    const crawlResult = await app.crawl(url, {
      limit: 10,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: true
      },
      ...options
    });
    return crawlResult;
  } catch (error) {
    throw new Error(`Crawling failed: ${error.message}`);
  }
};

module.exports = { scrapeUrl, crawlUrl };
