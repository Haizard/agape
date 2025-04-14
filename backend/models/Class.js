const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  stream: {
    type: String,
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    required: true,
    default: 'O_LEVEL'
  },
  // Legacy field - kept for backward compatibility
  subjectCombination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectCombination'
  },
  // New field for multiple subject combinations
  subjectCombinations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectCombination'
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
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
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Class', classSchema);
