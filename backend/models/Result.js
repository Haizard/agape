const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');
const aLevelGradeCalculator = require('../utils/aLevelGradeCalculator');
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('../utils/logger');

/**
 * @deprecated This model is deprecated. Use OLevelResult or ALevelResult instead.
 * This model will be removed in a future version.
 */
// Check if the model is deprecated
const deprecatedFlagPath = path.join(__dirname, 'RESULT_MODEL_DEPRECATED');
const isDeprecated = fs.existsSync(deprecatedFlagPath);

if (isDeprecated) {
  logger.warn('WARNING: The Result model is deprecated and will be removed in a future version.');
  logger.warn('Please use OLevelResult or ALevelResult instead.');
}

const ResultSchema = new mongoose.Schema({
  // Original fields with proper references
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  examTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  marksObtained: { type: Number, required: true },

  // Education level field
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    required: true,
    default: 'O_LEVEL'
  },

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

// Pre-save middleware to set alias fields and calculate grade/points
ResultSchema.pre('save', function(next) {
  // Set alias fields to match the original fields
  this.student = this.studentId;
  this.exam = this.examId;
  this.academicYear = this.academicYearId;
  this.examType = this.examTypeId;
  this.subject = this.subjectId;
  this.class = this.classId;

  // Always recalculate grade and points based on marksObtained and education level
  // This ensures consistency between marks and grades
  if (this.marksObtained !== undefined) {
    // Get the education level
    const educationLevel = this.educationLevel || EDUCATION_LEVELS.O_LEVEL;

    // Use the appropriate level-specific calculator
    let gradeResult;
    if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
      gradeResult = aLevelGradeCalculator.calculateGradeAndPoints(this.marksObtained);
    } else {
      gradeResult = oLevelGradeCalculator.calculateGradeAndPoints(this.marksObtained);
    }

    this.grade = gradeResult.grade;
    this.points = gradeResult.points;

    // Log the grade calculation for debugging
    logger.debug(`Calculated grade for marks ${this.marksObtained}: ${this.grade} (${this.points} points)`);
    logger.debug(`Result for student ${this.studentId}, subject ${this.subjectId}, exam ${this.examId}`);
  }

  next();
});

// Add a unique compound index to ensure each student has only one result per subject per exam per academic year
ResultSchema.index(
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
ResultSchema.pre('save', async function(next) {
  try {
    // Skip validation for updates to existing documents
    if (!this.isNew) {
      return next();
    }

    // Check if this student already has a result for this exam, academic year, and exam type
    // but for a different subject
    const Result = this.constructor;
    const existingResult = await Result.findOne({
      studentId: this.studentId,
      examId: this.examId,
      academicYearId: this.academicYearId,
      examTypeId: this.examTypeId,
      classId: this.classId,
      subjectId: { $ne: this.subjectId } // Different subject
    });

    if (existingResult) {
      logger.debug(`Found existing result for student ${this.studentId} in exam ${this.examId} for subject ${existingResult.subjectId}`);
      logger.debug(`Ensuring marks are not duplicated from subject ${existingResult.subjectId} to ${this.subjectId}`);

      // If the marks are exactly the same, it might be a duplicate
      if (existingResult.marksObtained === this.marksObtained) {
        logger.warn(`Potential duplicate marks detected: ${this.marksObtained} for student ${this.studentId} across subjects ${existingResult.subjectId} and ${this.subjectId}`);
        // We'll allow it but log a warning, as it could be legitimate that a student got the same marks in different subjects
      }
    }

    next();
  } catch (error) {
    logger.error('Error in Result pre-save validation:', error);
    next(error);
  }
});

module.exports = mongoose.model('Result', ResultSchema);
