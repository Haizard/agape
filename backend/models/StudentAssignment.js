const mongoose = require('mongoose');

const studentAssignmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated'],
    default: 'active'
  }
}, { timestamps: true });

// Compound index to ensure a student can only be assigned to one class at a time
studentAssignmentSchema.index({ studentId: 1 }, { unique: true });

const StudentAssignment = mongoose.model('StudentAssignment', studentAssignmentSchema);

module.exports = StudentAssignment;
