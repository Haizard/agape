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
      },
      assessments: [{
        name: {
          type: String,
          required: true
        },
        weightage: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        },
        maxMarks: {
          type: Number,
          default: 100
        },
        term: {
          type: String,
          required: true
        },
        examDate: Date,
        status: {
          type: String,
          enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
          default: 'PENDING'
        }
      }],
      totalWeightage: {
        type: Number,
        validate: {
          validator: function(v) {
            return this.assessments.reduce((sum, a) => sum + a.weightage, 0) === 100;
          },
          message: 'Total weightage must equal 100%'
        }
      }
    }]
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'DRAFT'
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
