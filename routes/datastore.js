const express = require('express');
const router = express.Router();
const { 
  addContent, 
  getContents, 
  getContentById, 
  searchContents, 
  deleteContent, 
  updateContent 
} = require('../controllers/datastore');
const formidableMiddleware = require('../middlewares/formidableMiddleware'); // Import the new middleware
const { verifyClientToken } = require('../middlewares/authmiddleware');

// Define routes and link them to controller functions
// Use the upload middleware for the POST /content route
router.route('/content').post(verifyClientToken,formidableMiddleware, addContent).get(verifyClientToken,getContents); // Apply formidable middleware

// Use the upload middleware for the PUT /content/:id route as well
router.route('/content/:id')
  .get(getContentById)
  .delete(deleteContent)
  .put(formidableMiddleware, updateContent); // Apply formidable middleware

router.route('/search').get(searchContents);

module.exports = router; 