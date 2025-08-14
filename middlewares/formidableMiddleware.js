const formidable = require('formidable');

const formidableMiddleware = (req, res, next) => {
  const form = new formidable.IncomingForm({ multiples: false }); // Use new formidable.IncomingForm()

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error parsing form data:', err);
      return res.status(400).json({ success: false, message: 'Error processing file upload', error: err.message });
    }

    // Attach parsed fields and files to the request object
    req.formFields = fields;
    req.formFiles = files;

    next();
  });
};

module.exports = formidableMiddleware; 