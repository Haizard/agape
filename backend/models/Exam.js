const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['OPEN_TEST', 'MID_TERM', 'FINAL'],
    required: true
  },
  examType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamType',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  term: {
    type: String,
    required: true
  },
  startDate: Date,
  endDate: Date,
  classes: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    subjects: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      examDate: Date,
      maxMarks: {
        type: Number,
        default: 100
      }
    }]
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'DRAFT'
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
