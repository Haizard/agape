const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Marks History Schema
 * Tracks all changes made to student marks for audit purposes
 */
const MarksHistorySchema = new mongoose.Schema({
  // Reference to the result being modified
  resultId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'resultModel'
  },
  
  // The model type (OLevelResult or ALevelResult)
  resultModel: {
    type: String,
    required: true,
    enum: ['OLevelResult', 'ALevelResult']
  },
  
  // Student information
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  
  // Subject information
  subjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true 
  },
  
  // Exam information
  examId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exam', 
    required: true 
  },
  
  // Academic year information
  academicYearId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AcademicYear', 
    required: true 
  },
  
  // Class information
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  
  // User who made the change
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Change details
  changeType: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true
  },
  
  // Previous values (before change)
  previousValues: {
    marksObtained: { type: Number },
    grade: { type: String },
    points: { type: Number },
    comment: { type: String },
    isPrincipal: { type: Boolean }, // For A-Level only
    assessments: [{
      name: { type: String },
      weightage: { type: Number },
      marksObtained: { type: Number },
      term: { type: String },
      examDate: Date,
      status: { type: String }
    }],
    totalWeightage: { type: Number }
  },
  
  // New values (after change)
  newValues: {
    marksObtained: { type: Number, required: true },
    grade: { type: String, required: true },
    points: { type: Number, required: true },
    comment: { type: String },
    isPrincipal: { type: Boolean }, // For A-Level only
    assessments: [{
      name: { type: String },
      weightage: { type: Number },
      marksObtained: { type: Number },
      term: { type: String },
      examDate: Date,
      status: { type: String }
    }],
    totalWeightage: { type: Number }
  },
  
  // Additional metadata
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    required: true
  },
  
  // IP address of the user who made the change
  ipAddress: {
    type: String
  },
  
  // User agent of the user who made the change
  userAgent: {
    type: String
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for efficient querying
MarksHistorySchema.index({ resultId: 1, timestamp: -1 });
MarksHistorySchema.index({ studentId: 1, timestamp: -1 });
MarksHistorySchema.index({ subjectId: 1, timestamp: -1 });
MarksHistorySchema.index({ examId: 1, timestamp: -1 });
MarksHistorySchema.index({ userId: 1, timestamp: -1 });
MarksHistorySchema.index({ changeType: 1, timestamp: -1 });

// Pre-save hook for logging
MarksHistorySchema.pre('save', function(next) {
  logger.info(`Marks history entry created: ${this.changeType} for student ${this.studentId}, subject ${this.subjectId}, exam ${this.examId}`);
  next();
});

const MarksHistory = mongoose.model('MarksHistory', MarksHistorySchema);

module.exports = MarksHistory;
