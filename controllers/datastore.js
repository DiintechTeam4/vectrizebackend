const DatastoreContent = require('../models/DatastoreContent');
const { s3Client } = require('../utils/s3'); // Import s3Client if needed for other operations
const { DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3'); // Import DeleteObjectCommand and PutObjectCommand
const fs = require('fs'); // Import fs to read file streams
const { Buffer } = require('buffer'); // Import Buffer to create text buffer

exports.addContent = async (req, res) => {
  try {
    const {clientId} = req.client.userId;
    console.log(clientId)
    // Access form fields and files from the middleware
    const fields = req.formFields;
    const files = req.formFiles;

    // Access form fields and files
    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const content = Array.isArray(fields.content) ? fields.content[0] : fields.content; // For text/URL types
    const projectId = Array.isArray(fields.projectId) ? fields.projectId[0] : fields.projectId; // Project ID
    const uploadedFile = Array.isArray(files.contentFile) ? files.contentFile[0] : files.contentFile; // 'contentFile' is the field name from frontend

    // Basic Validation
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const fileTypes = ['Image', 'Video', 'PDF'];
    const urlTypes = ['YouTube', 'Link', 'Website'];

    let contentValue = content; // Default for non-file types (like URLs)
    let metadata = {};
    let s3UploadParams = null;

    if (type === 'Text') {
      if (!content) {
        return res.status(400).json({ success: false, message: "Content is required for Text type" });
      }
      // Prepare text content as a Buffer for S3 upload
      const textBuffer = Buffer.from(content, 'utf-8');
      const textFileName = `${Date.now()}-${title.replace(/\s+/g, '_') || 'text_content'}.txt`;

      s3UploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${clientId}/uploads/text/${textFileName}`, // Store text in a 'uploads/text' folder
        Body: textBuffer,
        ContentType: 'text/plain',
        Metadata: { // Optional: add custom metadata
            title: title,
            originalFileName: textFileName,
            type: 'Text',
        },
      };
       contentValue = s3UploadParams.Key; // Store S3 key
        metadata = {
            fileName: textFileName,
            mimeType: 'text/plain',
            size: textBuffer.length,
        };

    } 
    else if (fileTypes.includes(type)) {
      if (!uploadedFile) {
        return res.status(400).json({ success: false, message: `File upload is required for ${type} type` });
      }
      // Prepare uploaded file for S3 upload
      const fileStream = fs.createReadStream(uploadedFile.filepath);
      const originalFileName = uploadedFile.originalFilename;
      const fileContentType = uploadedFile.mimetype;

      s3UploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${clientId}/uploads/${type.toLowerCase()}/${Date.now()}-${originalFileName}`, // Store file types in type-specific folders
        Body: fileStream,
        ContentType: fileContentType,
        Metadata: { // Optional: add custom metadata
            title: title,
            originalFileName: originalFileName,
            type: type,
        },
      };
      contentValue = s3UploadParams.Key; // Store S3 key
      metadata = {
          fileName: originalFileName,
          mimeType: fileContentType,
          size: uploadedFile.size,
      };

    } else if (urlTypes.includes(type)) {
       if (!content) {
          return res.status(400).json({ success: false, message: `URL is required for ${type} type` });
       }
       // For URL types, contentValue is already the URL from fields.content
       // No S3 upload for the content itself, but could save thumbnail/metadata later
       metadata = { url: content };

    } else {
         return res.status(400).json({ success: false, message: 'Invalid content type provided' });
    }

    // Perform S3 upload if params are set
    if (s3UploadParams) {
        try {
          const command = new PutObjectCommand(s3UploadParams);
          const uploadResult = await s3Client.send(command);
          console.log('Successfully uploaded content to S3:', uploadResult);
        } catch (s3Error) {
          console.error('Error uploading content to S3:', s3Error);
          return res.status(500).json({ success: false, message: 'Failed to upload content to S3', error: s3Error.message });
        }
    }

    // Create a new datastore content document
    const newContent = new DatastoreContent({
      clientId,
      projectId,
      type,
      title,
      content: contentValue, // This will be S3 key or URL
      metadata,
      // If you implemented user association, add req.user.id here
      // user: req.user.id,
    });

    // Save the document to the database
    await newContent.save();

    res.status(201).json({
      success: true,
      data: newContent,
    });

  } catch (error) {
    console.error('Error adding datastore content:', error);
    res.status(500).json({ success: false, message: 'Failed to add content', error: error.message });
  }
};


exports.getContents = async (req, res) => {
  try {
    const {clientId} = req.client.userId
    const { projectId } = req.query; // Get projectId from query params
    
    // Build query
    const query = { clientId };
    if (projectId) {
      query.projectId = projectId;
    }
    
    // Fetch content from the database
    const contents = await DatastoreContent.find(query).populate('projectId', 'name');

    res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (error) {
    console.error('Error fetching datastore contents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contents', error: error.message });
  }
};

// @desc    Get single datastore content by ID
// @route   GET /api/datastore/content/:id
// @access  Private (You will likely need authentication middleware)
exports.getContentById = async (req, res) => {
  try {
    const content = await DatastoreContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    res.status(200).json({
      success: true,
      data: content,
    });

  } catch (error) {
    console.error('Error fetching datastore content by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content', error: error.message });
  }
};

exports.searchContents = async (req, res) => {
  try {
    const { q, type } = req.query; // Get search query 'q' and optional type from query parameters
    const query = {};

    // If a search query is provided, add text search criteria
    if (q) {
      // Using $text and $search for full-text search (requires text index on title and content fields)
      // Alternatively, use regex for simpler substring matching if text index is not set up
      query.$text = { $search: q };
      // Or using regex (less efficient for large datasets without proper indexing):
      // query.$or = [
      //   { title: { $regex: q, $options: 'i' } },
      //   { content: { $regex: q, $options: 'i' } },
      // ];
    }

    // If a content type is provided, add type filter
    if (type) {
      query.type = type;
    }

    // Find content based on the constructed query
    // Sort by text match score if using $text search
    const contents = q 
      ? await DatastoreContent.find(query, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } })
      : await DatastoreContent.find(query);

    res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    });

  } catch (error) {
    console.error('Error searching datastore content:', error);
    res.status(500).json({ success: false, message: 'Failed to search contents', error: error.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const content = await DatastoreContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // If the content is a file type, delete the corresponding object from S3
    const fileTypes = ['Image', 'Video', 'PDF'];
    if (fileTypes.includes(content.type)) {
      const s3Key = content.content; // The 'content' field stores the S3 key for file types
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
      };

      try {
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);
        console.log(`Successfully deleted S3 object: ${s3Key}`);
      } catch (s3Error) {
        console.error(`Error deleting S3 object ${s3Key}:`, s3Error);
        // Decide how to handle S3 deletion failure: return error or proceed with DB deletion?
        // For now, we'll just log the error and proceed to delete the DB record.
        // In a production system, you might want a more robust error handling/retry mechanism.
      }
    }

    // Delete the content record from the database
    await content.deleteOne(); // Using deleteOne() instead of remove() for Mongoose v6+

    res.status(200).json({
      success: true,
      data: {},
      message: 'Content deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting datastore content:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content', error: error.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    console.log(contentId);
    // Access form fields and files from the middleware
    const fields = req.formFields;
    const files = req.formFiles;

    // Access updates from form fields
    const updates = {};
    if (fields.type) updates.type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    if (fields.title) updates.title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    if (fields.content) updates.content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
    if (fields.projectId) updates.projectId = Array.isArray(fields.projectId) ? fields.projectId[0] : fields.projectId;

    const uploadedFile = Array.isArray(files.contentFile) ? files.contentFile[0] : files.contentFile; // 'contentFile' is the field name from frontend

    let content = await DatastoreContent.findById(contentId);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const fileTypes = ['Image', 'Video', 'PDF'];
    const isFileContent = fileTypes.includes(content.type);
    const isUpdatingToFileType = updates.type && fileTypes.includes(updates.type);

    // Handle file upload update (if a new file is provided)
    if (uploadedFile && (isFileContent || isUpdatingToFileType)) {
      // If the existing content was a file, delete the old one from S3
      if (isFileContent && content.content) {
        const oldS3Key = content.content;
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: oldS3Key,
        };

        try {
          const command = new DeleteObjectCommand(deleteParams);
          await s3Client.send(command);
          console.log(`Successfully deleted old S3 object: ${oldS3Key}`);
        } catch (s3Error) {
          console.error(`Error deleting old S3 object ${oldS3Key}:`, s3Error);
          // Log error but continue with the update
        }
      }

      // Upload the new file to S3
      const fileStream = fs.createReadStream(uploadedFile.filepath);
      const newFileName = uploadedFile.originalFilename;
      const newFileType = uploadedFile.mimetype;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${Date.now()}-${newFileName}`, // Store in 'uploads' folder
        Body: fileStream,
        ContentType: newFileType,
      };

      try {
        const command = new PutObjectCommand(uploadParams);
        const uploadResult = await s3Client.send(command);
        console.log('Successfully uploaded new file to S3:', uploadResult);

        // Update content with the new S3 file details
        content.content = uploadParams.Key; // Store the new S3 object key
        content.metadata = {
            fileName: newFileName,
            mimeType: newFileType,
            size: uploadedFile.size,
        };
        // Update the type if it was changed to a file type
         if (isUpdatingToFileType) {
           content.type = updates.type;
         }

      } catch (s3Error) {
        console.error('Error uploading new file to S3:', s3Error);
        return res.status(500).json({ success: false, message: 'Failed to upload new file to S3', error: s3Error.message });
      }
    } else if (isUpdatingToFileType && !uploadedFile) {
         // If trying to change to a file type but no file is uploaded
          return res.status(400).json({ success: false, message: `File upload is required to change content type to ${updates.type}.` });
    } else {
      // If no new file is uploaded or updating a non-file type
      // Prevent changing to a file type without uploading a file handled above

       // Update other fields (title, content for non-file types, and possibly type)
       if (updates.title !== undefined) {
           content.title = updates.title;
       }
       // Only update the 'content' field if it's not a file type and content update is provided
       if (!isFileContent && updates.content !== undefined) {
            content.content = updates.content;
       }
       // Allow updating type if it's not changing to/from a file type without a file upload
        if (updates.type && !(fileTypes.includes(updates.type) !== isFileContent && !uploadedFile)) {
            content.type = updates.type;
        }
        // Update projectId if provided
        if (updates.projectId !== undefined) {
            content.projectId = updates.projectId;
        }

    }

    // Save the updated document
    await content.save();

    res.status(200).json({
      success: true,
      data: content,
      message: 'Content updated successfully',
    });

  } catch (error) {
    console.error('Error updating datastore content:', error);
    res.status(500).json({ success: false, message: 'Failed to update content', error: error.message });
  }
}; 