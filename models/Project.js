const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: [true, "Client ID is required"],
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
    },
    metadata: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;
