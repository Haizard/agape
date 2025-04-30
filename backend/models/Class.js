const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  stream: {
    type: String,
    required: true,
    index: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true,
    index: true
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    required: true,
    default: 'O_LEVEL',
    index: true
  },
  // Legacy field - kept for backward compatibility
  subjectCombination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectCombination',
    index: true
  },
  // New field for multiple subject combinations
  subjectCombinations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectCombination'
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    index: true
  },
  // Optimize subject-teacher relationship
  subjects: [{
    _id: false, // Disable automatic _id for subdocuments
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  capacity: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  // Add indexes for common queries
  indexes: [
    // Compound index for finding classes by academic year and education level
    { academicYear: 1, educationLevel: 1, status: 1 },
    // Compound index for finding classes by teacher
    { classTeacher: 1, status: 1 },
    // Compound index for name and stream
    { name: 1, stream: 1 }
  ]
});

// Add methods for subject management
classSchema.methods.getSubjectTeacher = function(subjectId) {
  const subjectAssignment = this.subjects.find(
    s => s.subject && s.subject.toString() === subjectId.toString()
  );
  return subjectAssignment ? subjectAssignment.teacher : null;
};

classSchema.methods.getTeacherSubjects = function(teacherId) {
  return this.subjects
    .filter(s => s.teacher && s.teacher.toString() === teacherId.toString())
    .map(s => s.subject);
};

// Add static methods for querying
classSchema.statics.findActiveClasses = function(academicYear) {
  return this.find({
    academicYear,
    status: 'active'
  })
  .select('name stream section educationLevel')
  .lean();
};

classSchema.statics.findTeacherClasses = function(teacherId) {
  return this.find({
    $or: [
      { classTeacher: teacherId },
      { 'subjects.teacher': teacherId }
    ],
    status: 'active'
  })
  .select('name stream section educationLevel')
  .lean();
};

module.exports = mongoose.model('Class', classSchema);
