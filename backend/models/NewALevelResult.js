/**
 * New A-Level Result Model
 *
 * This model represents A-Level examination results with improved structure and validation.
 */
const mongoose = require('mongoose');
const newALevelGradeCalculator = require('../utils/newALevelGradeCalculator');
const logger = require('../utils/logger');

const NewALevelResultSchema = new mongoose.Schema({
  // Core fields
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam ID is required']
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
    // Making this optional
  },
  examTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamType'
    // Making this optional
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks cannot be less than 0'],
    max: [100, 'Marks cannot be more than 100']
  },

  // Result processing fields
  grade: { type: String },
  points: { type: Number },
  comment: { type: String },
  isPrincipal: { type: Boolean, default: false }, // Whether this is a principal subject
  isInCombination: { type: Boolean, default: true }, // Whether this subject is in student's combination

  // Metadata fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound index to prevent duplicate entries
NewALevelResultSchema.index(
  { studentId: 1, examId: 1, subjectId: 1 },
  { unique: true, name: 'unique_a_level_result' }
);

// Pre-save middleware to calculate grade and points
NewALevelResultSchema.pre('save', function(next) {
  // Calculate grade and points based on A-LEVEL grading system
  if (this.marksObtained !== undefined) {
    // Use the A-Level specific grade calculator
    const { grade, points } = newALevelGradeCalculator.calculateGradeAndPoints(this.marksObtained);
    this.grade = grade;
    this.points = points;

    // Log the grade calculation for debugging
    logger.debug(`[NEW-A-LEVEL] Calculated grade for marks ${this.marksObtained}: ${this.grade} (${this.points} points)`);
    logger.debug(`[NEW-A-LEVEL] Result for student ${this.studentId}, subject ${this.subjectId}, exam ${this.examId}`);
  }

  // Set updatedAt timestamp
  this.updatedAt = Date.now();

  next();
});

// Virtual for formatted marks (for display)
NewALevelResultSchema.virtual('formattedMarks').get(function() {
  return this.marksObtained !== undefined ? this.marksObtained.toFixed(1) : '-';
});

// Method to check if this is a passing grade
NewALevelResultSchema.methods.isPassing = function() {
  return this.grade !== 'F';
};

// Static method to find results by student and exam
NewALevelResultSchema.statics.findByStudentAndExam = async function(studentId, examId) {
  return this.find({ studentId, examId })
    .populate('subjectId', 'name code type')
    .sort('subjectId.name');
};

// Static method to find principal subjects for a student in an exam
NewALevelResultSchema.statics.findPrincipalSubjects = async function(studentId, examId) {
  return this.find({
    studentId,
    examId,
    isPrincipal: true
  })
  .populate('subjectId', 'name code type')
  .sort('points');
};

// Static method to calculate total points from best 3 principal subjects
NewALevelResultSchema.statics.calculateTotalPoints = async function(studentId, examId) {
  const principalResults = await this.findPrincipalSubjects(studentId, examId);

  // Sort by points (ascending, since lower is better in A-Level)
  const sortedResults = principalResults.sort((a, b) => a.points - b.points);

  // Take best 3 (or fewer if not enough principal subjects)
  const best3 = sortedResults.slice(0, 3);

  // Calculate total points
  const totalPoints = best3.reduce((sum, result) => sum + result.points, 0);

  return {
    totalPoints,
    best3,
    division: newALevelGradeCalculator.calculateDivision(totalPoints)
  };
};

const NewALevelResult = mongoose.model('NewALevelResult', NewALevelResultSchema);

module.exports = NewALevelResult;
