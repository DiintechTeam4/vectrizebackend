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

    let finalUrl = url;

    // If the document is a .txt, fetch and convert to PDF, then host it and use the PDF URL
    if (/\.txt(\?.*)?$/i.test(url)) {
      const axios = require('axios');
      const PDFDocument = require('pdfkit');
      const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      const s3Region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
      const s3Bucket = process.env.AWS_BUCKET_NAME;
      if (!s3Region || !s3Bucket) {
        // No S3 configured; skip conversion and use original URL
        console.warn('[processDocument] S3 config missing, skipping TXT->PDF conversion. Using original URL.');
        const payload = { url: finalUrl, book_name, chapter_name: chapter_name || '', client_id };
        const response = await callGrpc(client.ProcessDocument, payload);
        return res.status(200).json({ success: true, data: response, used_url: finalUrl, note: 'Skipped TXT->PDF conversion (missing S3 config)' });
      }

      // 1) Download text
      const textResp = await axios.get(url, { responseType: 'text' });
      const textContent = typeof textResp.data === 'string' ? textResp.data : String(textResp.data || '');

      // 2) Generate PDF in memory
      const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      const pdfDone = new Promise((resolve) => pdfDoc.on('end', resolve));

      pdfDoc.fontSize(12);
      pdfDoc.text(textContent, { align: 'left' });
      pdfDoc.end();
      await pdfDone;
      const pdfBuffer = Buffer.concat(chunks);

      // 3) Upload PDF to S3
      const s3Key = `uploads/converted/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
      const s3Client = new S3Client({ region: s3Region });
      await s3Client.send(new PutObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      }));

      // 4) Create a signed GET URL (temporary) or build public URL if bucket is public
      if (process.env.S3_PUBLIC_BASE_URL) {
        finalUrl = `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${s3Key}`;
      } else {
        finalUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key }),
          { expiresIn: 60 * 60 }
        );
      }
    }

    const payload = { url: finalUrl, book_name, chapter_name: chapter_name || '', client_id };
    const response = await callGrpc(client.ProcessDocument, payload);
    return res.status(200).json({ success: true, data: response, used_url: finalUrl });
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
      system_prompt,
      llm_model,
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
      system_prompt: system_prompt || '',
      llm_model: llm_model || '',
    };

    const response = await callGrpc(client.QueryData, payload);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'gRPC error' });
  }
};


