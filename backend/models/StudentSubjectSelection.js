const mongoose = require('mongoose');

const studentSubjectSelectionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  // The class when the selection was made (typically Form 1)
  selectionClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  // Academic year when the selection was made
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  // Core subjects are automatically assigned
  coreSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  // Optional subjects selected by the student
  optionalSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  // When the selection was made
  selectionDate: {
    type: Date,
    default: Date.now
  },
  // Who made or approved the selection
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Status of the selection
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  // Any notes about the selection
  notes: String
}, { timestamps: true });

// Create a compound index to ensure a student can only have one active selection
studentSubjectSelectionSchema.index({ student: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('StudentSubjectSelection', studentSubjectSelectionSchema);
