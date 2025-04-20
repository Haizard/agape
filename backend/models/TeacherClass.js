/**
 * TeacherClass Model
 * 
 * This model represents the relationship between teachers and classes.
 * It tracks which teachers are assigned to which classes.
 */
const mongoose = require('mongoose');

const teacherClassSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
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
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Reference to students in this class that this teacher is responsible for
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, { timestamps: true });

// Create a compound index to ensure uniqueness
teacherClassSchema.index({ teacherId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('TeacherClass', teacherClassSchema);
