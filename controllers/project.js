const Project = require('../models/Project');
const DatastoreContent = require('../models/DatastoreContent');

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const clientId = req.client.userId;
    const { name, description, status } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ success: false, message: "Project name is required" });
    }

    // Create new project
    const newProject = new Project({
      clientId,
      name,
      description,
      status: status || 'active',
    });

    await newProject.save();

    res.status(201).json({
      success: true,
      data: newProject,
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project', error: error.message });
  }
};

// Get all projects for a client
exports.getProjects = async (req, res) => {
  try {
    const clientId = req.client.userId;
    
    const projects = await Project.find({ clientId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message });
  }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const clientId = req.client.userId;
    const projectId = req.params.id;

    const project = await Project.findOne({ _id: projectId, clientId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const clientId = req.client.userId;
    const projectId = req.params.id;
    const { name, description, status } = req.body;

    const project = await Project.findOne({ _id: projectId, clientId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const clientId = req.client.userId;
    const projectId = req.params.id;

    const project = await Project.findOne({ _id: projectId, clientId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if project has any content
    const contentCount = await DatastoreContent.countDocuments({ projectId });
    
    if (contentCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete project. It contains ${contentCount} items. Please remove all items first.` 
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Project deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
  }
};

// Get project with its contents
exports.getProjectWithContents = async (req, res) => {
  try {
    const clientId = req.client.userId;
    const projectId = req.params.id;

    const project = await Project.findOne({ _id: projectId, clientId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get all contents for this project
    const contents = await DatastoreContent.find({ projectId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        project,
        contents,
        contentCount: contents.length,
      },
    });

  } catch (error) {
    console.error('Error fetching project with contents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project with contents', error: error.message });
  }
};
