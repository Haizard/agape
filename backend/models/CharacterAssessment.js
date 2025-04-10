const mongoose = require('mongoose');

const characterAssessmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  // Character traits assessment
  punctuality: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  discipline: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  respect: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  leadership: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  participation: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  // Overall assessment
  overallAssessment: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  // Teacher's comments
  comments: {
    type: String,
    default: ''
  },
  // Who made the assessment
  assessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // When the assessment was made
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  // When the assessment was last updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index to ensure a student can only have one assessment per exam
characterAssessmentSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const CharacterAssessment = mongoose.model('CharacterAssessment', characterAssessmentSchema);

module.exports = CharacterAssessment;
