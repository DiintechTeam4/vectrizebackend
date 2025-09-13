const { scrapeUrl, crawlUrl } = require('../services/firecrawlService');
const ScrapedData = require('../models/scrapeddata');

const scrapeSingleUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const result = await scrapeUrl(url);
    
    // Save to database
    const scrapedData = new ScrapedData({
      url: url,
      title: result.metadata?.title,
      content: result.html,
      markdown: result.markdown,
      metadata: {
        description: result.metadata?.description,
        keywords: result.metadata?.keywords,
        author: result.metadata?.author
      }
    });
    
    await scrapedData.save();
    
    res.json({ 
      success: true, 
      message: 'URL scraped successfully',
      data: {
        id: scrapedData._id,
        url: scrapedData.url,
        title: scrapedData.title,
        scrapedAt: scrapedData.scrapedAt
      }
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const crawlWebsite = async (req, res) => {
  try {
    const { url, limit = 10 } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const result = await crawlUrl(url, { limit });
    
    // Save multiple pages to database
    const savedData = [];
    for (const page of result.data) {
      const scrapedData = new ScrapedData({
        url: page.metadata?.sourceURL || page.url,
        title: page.metadata?.title,
        content: page.html,
        markdown: page.markdown,
        metadata: {
          description: page.metadata?.description,
          keywords: page.metadata?.keywords,
          author: page.metadata?.author
        }
      });
      
      const saved = await scrapedData.save();
      savedData.push({
        id: saved._id,
        url: saved.url,
        title: saved.title,
        scrapedAt: saved.scrapedAt
      });
    }
    
    res.json({ 
      success: true, 
      message: `Successfully crawled ${savedData.length} pages`,
      data: savedData
    });
  } catch (error) {
    console.error('Crawling error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getScrapedData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const data = await ScrapedData.find()
      .sort({ scrapedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('url title scrapedAt metadata');
    
    const total = await ScrapedData.countDocuments();
    
    res.json({ 
      success: true, 
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getScrapedDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await ScrapedData.findById(id);
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get data by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteScrapedData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await ScrapedData.findByIdAndDelete(id);
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }
    
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Delete data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  scrapeSingleUrl, 
  crawlWebsite, 
  getScrapedData, 
  getScrapedDataById, 
  deleteScrapedData 
};
