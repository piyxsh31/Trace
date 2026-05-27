const mongoose = require('mongoose');

const URL_REGEX = /^https?:\/\//;

const problemSchema = new mongoose.Schema(
  {
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sheet',
      required: [true, 'Sheet ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Problem name is required'],
      trim: true,
      maxlength: [300, 'Problem name cannot exceed 300 characters'],
    },
    link: {
      type: String,
      required: [true, 'Problem link is required'],
      trim: true,
      validate: {
        validator: (v) => URL_REGEX.test(v),
        message: 'Link must be a valid URL starting with http:// or https://',
      },
    },
    topics: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'A problem can have at most 10 topics',
      },
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard', ''],
        message: "Difficulty must be 'easy', 'medium', or 'hard'",
      },
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['unsolved', 'attempted', 'solved'],
        message: "Status must be 'unsolved', 'attempted', or 'solved'",
      },
      default: 'unsolved',
    },
    notes: {
      type: String,
      default: '',
    },
    solvedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
    },
  },
  { timestamps: true }
);

// Normalize topics before validation: trim, lowercase, truncate, filter empty
problemSchema.pre('validate', function (next) {
  if (Array.isArray(this.topics)) {
    this.topics = this.topics
      .map((t) => String(t).trim().toLowerCase().slice(0, 50))
      .filter((t) => t.length > 0);
  }
  next();
});

// Retrieval in original file order within a sheet
problemSchema.index({ sheetId: 1, order: 1 });

// Fast analytics and heatmap querying
problemSchema.index({ userId: 1, solvedAt: -1 });

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
