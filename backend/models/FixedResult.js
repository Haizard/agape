const mongoose = require('mongoose');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');
const logger = require('../utils/logger');

const FixedResultSchema = new mongoose.Schema({
  // Original fields with proper references
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, // Not required to allow for custom exams
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  examTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType' }, // Not required to allow for custom exams
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  marksObtained: { type: Number, required: true },

  // Additional fields for custom exams
  examName: { type: String }, // For custom exams without an examId

  // Additional fields for result processing
  grade: { type: String },
  points: { type: Number },
  comment: { type: String },

  // Alias fields for compatibility with report routes
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  examType: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-validate middleware to handle classId
FixedResultSchema.pre('validate', function(next) {
  // Ensure classId is set
  if (!this.classId) {
    logger.warn('Missing classId, using fallback');
    this.classId = '67f2fe0fdcc60fd7fef2ef36';
  }

  // Ensure classId is a valid ObjectId
  try {
    if (!mongoose.Types.ObjectId.isValid(this.classId)) {
      logger.warn('Invalid classId format, using fallback');
      this.classId = '67f2fe0fdcc60fd7fef2ef36';
    }
  } catch (err) {
    logger.error('Error validating classId, using fallback', err);
    this.classId = '67f2fe0fdcc60fd7fef2ef36';
  }

  next();
});

// Pre-save middleware to set alias fields
FixedResultSchema.pre('save', function(next) {
  // Set alias fields to match the original fields
  this.student = this.studentId;
  this.exam = this.examId;
  this.academicYear = this.academicYearId;
  this.examType = this.examTypeId;
  this.subject = this.subjectId;
  this.class = this.classId;

  // Calculate grade and points if not already set
  if (this.marksObtained !== undefined && !this.grade) {
    // Use the O-Level specific grade calculator
    // Fixed results always use O-LEVEL grading
    const { grade, points } = oLevelGradeCalculator.calculateGradeAndPoints(this.marksObtained);
    this.grade = grade;
    this.points = points;

    // Log the grade calculation for debugging
    logger.debug(`[FixedResult] Calculated grade for marks ${this.marksObtained}: ${this.grade} (${this.points} points)`);
  }

  next();
});

module.exports = mongoose.model('FixedResult', FixedResultSchema);
