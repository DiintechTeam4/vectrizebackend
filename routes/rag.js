const express = require('express');
const router = express.Router();

const { processDocument, queryData } = require('../controllers/rag');

// Process a document from URL
router.post('/process-document', processDocument);

// Query data (RAG/LLM)
router.post('/query', queryData);

module.exports = router;


