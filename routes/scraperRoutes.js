const express = require('express');
const router = express.Router();
const { 
  scrapeSingleUrl, 
  crawlWebsite, 
  getScrapedData, 
  getScrapedDataById, 
  deleteScrapedData 
} = require('../controllers/scraperController');

// Scrape a single URL
router.post('/scrape', scrapeSingleUrl);

// Crawl a website (multiple pages)
router.post('/crawl', crawlWebsite);

// Get all scraped data with pagination
router.get('/data', getScrapedData);

// Get specific scraped data by ID
router.get('/data/:id', getScrapedDataById);

// Delete scraped data by ID
router.delete('/data/:id', deleteScrapedData);

module.exports = router;
