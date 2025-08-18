const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject,
  getProjectWithContents
} = require('../controllers/project');
const { verifyClientToken } = require('../middlewares/authmiddleware');

// All routes require client authentication
router.use(verifyClientToken);

// Project routes
router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/contents')
  .get(getProjectWithContents);

module.exports = router;
