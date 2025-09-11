const { client } = require('../utils/ragClient');

// Helper to promisify gRPC unary calls
const callGrpc = (method, payload) => new Promise((resolve, reject) => {
  method.call(client, payload, (err, response) => {
    if (err) return reject(err);
    resolve(response);
  });
});

// POST /api/v1/rag/process-document
exports.processDocument = async (req, res) => {
  try {
    const { url, book_name, chapter_name, client_id } = req.body || {};

    if (!url || !book_name || !client_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: url, book_name, client_id',
      });
    }

    const payload = { url, book_name, chapter_name: chapter_name || '', client_id };
    const response = await callGrpc(client.ProcessDocument, payload);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'gRPC error' });
  }
};

// POST /api/v1/rag/query
exports.queryData = async (req, res) => {
  try {
    const {
      query_id,
      session_id,
      history,
      query,
      book_name,
      chapter_name,
      client_id,
      llm,
      top_k,
      tts,
    } = req.body || {};

    if (!query_id || !session_id || !query || !book_name || !client_id || !llm || typeof top_k !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: query_id, session_id, query, book_name, client_id, llm, top_k',
      });
    }

    const payload = {
      query_id,
      session_id,
      history: Array.isArray(history) ? history : [],
      query,
      book_name,
      chapter_name: chapter_name || '',
      client_id,
      llm,
      top_k,
      tts: !!tts,
    };

    const response = await callGrpc(client.QueryData, payload);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'gRPC error' });
  }
};


