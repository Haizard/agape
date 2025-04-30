const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active',
    index: true
  },
  // Add metadata fields
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true,
  // Add indexes for common queries
  indexes: [
    // Compound index for finding active assignments
    { teacher: 1, class: 1, status: 1 },
    // Compound index for subject assignments
    { subject: 1, class: 1, status: 1 },
    // Compound index for academic year queries
    { academicYear: 1, status: 1 },
    // Compound index for date range queries
    { startDate: 1, endDate: 1, status: 1 }
  ]
});

// Create a compound unique index to prevent duplicate assignments
teacherAssignmentSchema.index(
  { teacher: 1, subject: 1, class: 1, academicYear: 1 },
  { unique: true }
);

// Add utility methods
teacherAssignmentSchema.statics.findActiveAssignments = function(teacherId, classId) {
  return this.find({
    teacher: teacherId,
    class: classId,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  })
  .select('subject')
  .lean();
};

teacherAssignmentSchema.statics.checkExistingAssignment = async function(teacherId, subjectId, classId) {
  const existing = await this.findOne({
    teacher: teacherId,
    subject: subjectId,
    class: classId,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).lean();
  return existing != null;
};

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
