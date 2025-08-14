const mongoose = require("mongoose");

const DatastoreContentSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
    },
    type: {
      type: String,
      required: [true, "Content type is required"],
      enum: ["Text", "Image", "Video", "YouTube", "Link", "Website", "PDF"], // Allowed content types
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String, // This will store text content, or URL/key for file types
      required: [true, "Content is required"],
    },
    metadata: {
      type: Object,
    },
  },
  { timestamps: true }
); // Adds createdAt and updatedAt timestamps

const DatastoreContent = mongoose.model(
  "DatastoreContent",
  DatastoreContentSchema
);

module.exports = DatastoreContent;
