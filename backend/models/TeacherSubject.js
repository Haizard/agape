const mongoose = require('mongoose');

const teacherSubjectSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    index: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  // Add metadata for better tracking
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  // Add index for common queries
  indexes: [
    // Compound index for finding active assignments
    { teacherId: 1, classId: 1, status: 1 },
    // Compound index for subject assignments
    { subjectId: 1, classId: 1, status: 1 },
    // Compound index for academic year queries
    { academicYearId: 1, status: 1 }
  ]
});

// Create a compound unique index to prevent duplicate assignments
teacherSubjectSchema.index(
  { teacherId: 1, subjectId: 1, classId: 1, academicYearId: 1 },
  { unique: true }
);

// Add methods for assignment validation
teacherSubjectSchema.statics.findActiveAssignments = function(teacherId, classId) {
  return this.find({
    teacherId,
    classId,
    status: 'active'
  })
  .select('subjectId')
  .lean();
};

teacherSubjectSchema.statics.checkExistingAssignment = async function(teacherId, subjectId, classId) {
  const existing = await this.findOne({
    teacherId,
    subjectId,
    classId,
    status: 'active'
  }).lean();
  return existing != null;
};

// Add virtual population for assignedSubjects
teacherSubjectSchema.virtual('assignedSubjects', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: '_id',
  justOne: true
});

// Enable virtuals in JSON output
teacherSubjectSchema.set('toJSON', { virtuals: true });
teacherSubjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TeacherSubject', teacherSubjectSchema);
