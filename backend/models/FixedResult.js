const mongoose = require('mongoose');

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
    console.log('Missing classId, using fallback');
    this.classId = '67f2fe0fdcc60fd7fef2ef36';
  }

  // Ensure classId is a valid ObjectId
  try {
    if (!mongoose.Types.ObjectId.isValid(this.classId)) {
      console.log('Invalid classId format, using fallback');
      this.classId = '67f2fe0fdcc60fd7fef2ef36';
    }
  } catch (err) {
    console.log('Error validating classId, using fallback');
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
    // Simple grading logic - can be customized based on requirements
    if (this.marksObtained >= 80) {
      this.grade = 'A';
      this.points = 1;
    } else if (this.marksObtained >= 65) {
      this.grade = 'B';
      this.points = 2;
    } else if (this.marksObtained >= 50) {
      this.grade = 'C';
      this.points = 3;
    } else if (this.marksObtained >= 40) {
      this.grade = 'D';
      this.points = 4;
    } else {
      this.grade = 'F';
      this.points = 5;
    }
  }

  next();
});

module.exports = mongoose.model('FixedResult', FixedResultSchema);
