const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Sheet name is required'],
      trim: true,
      maxlength: [100, 'Sheet name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    problemCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Problem count cannot be negative'],
    },
    solvedCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Solved count cannot be negative'],
    },
  },
  { timestamps: true }
);

// Efficient listing by user, newest first
sheetSchema.index({ userId: 1, createdAt: -1 });

const Sheet = mongoose.model('Sheet', sheetSchema);

module.exports = Sheet;
