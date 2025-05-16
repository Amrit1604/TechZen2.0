const mongoose = require('mongoose');

const SupportIssueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'resolved', 'unresolved', 'ended'],
    default: 'waiting'
  },
  sessionId: {
    type: String,
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportIssue', SupportIssueSchema);