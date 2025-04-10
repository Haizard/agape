const mongoose = require('mongoose');

const migrationStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  processedRecords: {
    type: Number,
    default: 0
  },
  migratedRecords: {
    type: Number,
    default: 0
  },
  skippedRecords: {
    type: Number,
    default: 0
  },
  errorRecords: {
    type: Number,
    default: 0
  },
  errors: [{
    message: String,
    recordId: mongoose.Schema.Types.ObjectId,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const MigrationStatus = mongoose.model('MigrationStatus', migrationStatusSchema);

module.exports = MigrationStatus;
