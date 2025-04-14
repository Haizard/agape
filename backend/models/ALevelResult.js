const mongoose = require('mongoose');
const aLevelGradeCalculator = require('../utils/aLevelGradeCalculator');
const logger = require('../utils/logger');

const ALevelResultSchema = new mongoose.Schema({
  // Core fields
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  examTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  marksObtained: { type: Number, required: true },

  // Result processing fields
  grade: { type: String },
  points: { type: Number },
  comment: { type: String },
  isPrincipal: { type: Boolean, default: false }, // Whether this is a principal subject

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

// Pre-save middleware to set alias fields and calculate grade/points
ALevelResultSchema.pre('save', function(next) {
  // Set alias fields to match the original fields
  this.student = this.studentId;
  this.exam = this.examId;
  this.academicYear = this.academicYearId;
  this.examType = this.examTypeId;
  this.subject = this.subjectId;
  this.class = this.classId;

  // Calculate grade and points based on A-LEVEL grading system
  if (this.marksObtained !== undefined) {
    // Use the A-Level specific grade calculator
    const { grade, points } = aLevelGradeCalculator.calculateGradeAndPoints(this.marksObtained);
    this.grade = grade;
    this.points = points;

    // Log the grade calculation for debugging
    logger.debug(`[A-LEVEL] Calculated grade for marks ${this.marksObtained}: ${this.grade} (${this.points} points)`);
    logger.debug(`[A-LEVEL] Result for student ${this.studentId}, subject ${this.subjectId}, exam ${this.examId}`);
  }

  next();
});

// Add a unique compound index to ensure each student has only one result per subject per exam per academic year
ALevelResultSchema.index(
  {
    studentId: 1,
    subjectId: 1,
    examId: 1,
    academicYearId: 1,
    examTypeId: 1,
    classId: 1
  },
  { unique: true }
);

// Add a pre-save hook to validate that marks are not duplicated across subjects
ALevelResultSchema.pre('save', async function(next) {
  try {
    // Skip validation for updates to existing documents
    if (!this.isNew) {
      return next();
    }

    // Check if this student already has a result for this exam, academic year, and exam type
    // but for a different subject
    const ALevelResult = this.constructor;
    const existingResult = await ALevelResult.findOne({
      studentId: this.studentId,
      examId: this.examId,
      academicYearId: this.academicYearId,
      examTypeId: this.examTypeId,
      classId: this.classId,
      subjectId: { $ne: this.subjectId } // Different subject
    });

    if (existingResult) {
      logger.debug(`[A-LEVEL] Found existing result for student ${this.studentId} in exam ${this.examId} for subject ${existingResult.subjectId}`);
      logger.debug(`[A-LEVEL] Ensuring marks are not duplicated from subject ${existingResult.subjectId} to ${this.subjectId}`);

      // If the marks are exactly the same, it might be a duplicate
      if (existingResult.marksObtained === this.marksObtained) {
        logger.warn(`[A-LEVEL] Potential duplicate marks detected: ${this.marksObtained} for student ${this.studentId} across subjects ${existingResult.subjectId} and ${this.subjectId}`);
        // We'll allow it but log a warning, as it could be legitimate that a student got the same marks in different subjects
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ALevelResult', ALevelResultSchema);
