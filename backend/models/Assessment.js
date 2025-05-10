const mongoose = require('mongoose');

/**
 * Assessment Schema
 * Defines the structure for assessment documents
 */
const assessmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assessment name is required'],
    trim: true
  },
  weightage: {
    type: Number,
    required: [true, 'Weightage is required'],
    min: [0, 'Weightage cannot be negative'],
    max: [100, 'Weightage cannot exceed 100']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [0, 'Maximum marks cannot be negative'],
    default: 100
  },
  term: {
    type: String,
    required: [true, 'Term is required'],
    enum: {
      values: ['1', '2', '3'],
      message: 'Invalid term selected'
    }
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'inactive'],
      message: 'Invalid status'
    },
    default: 'draft'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  // References to other models
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  examTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamType'
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    default: 'O_LEVEL'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
assessmentSchema.index({ term: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ examDate: 1 });

// Virtual for checking if assessment is upcoming
assessmentSchema.virtual('isUpcoming').get(function() {
  return new Date(this.examDate) > new Date();
});

// Virtual for checking if assessment is completed
assessmentSchema.virtual('isCompleted').get(function() {
  return new Date(this.examDate) < new Date();
});

// Pre-save middleware to validate total weightage
assessmentSchema.pre('save', async function(next) {
  try {
    if (this.isModified('weightage')) {
      const Assessment = this.constructor;
      const existingAssessments = await Assessment.find({
        _id: { $ne: this._id },
        term: this.term,
        status: 'active'
      });

      const totalWeightage = existingAssessments.reduce(
        (sum, assessment) => sum + assessment.weightage,
        this.weightage
      );

      if (totalWeightage > 100) {
        throw new Error('Total weightage for the term cannot exceed 100%');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to calculate grade based on marks
assessmentSchema.methods.calculateGrade = function(marksObtained) {
  const percentage = (marksObtained / this.maxMarks) * 100;

  if (percentage >= 75) return 'A';
  if (percentage >= 65) return 'B';
  if (percentage >= 45) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
};

// Static method to get assessments by term
assessmentSchema.statics.getByTerm = function(term) {
  return this.find({
    term,
    status: 'active'
  }).sort({ examDate: 1 });
};

// Static method to get upcoming assessments
assessmentSchema.statics.getUpcoming = function() {
  return this.find({
    examDate: { $gt: new Date() },
    status: 'active'
  }).sort({ examDate: 1 });
};

// Static method to get assessment statistics
assessmentSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $match: { status: 'active' }
    },
    {
      $group: {
        _id: '$term',
        totalAssessments: { $sum: 1 },
        averageWeightage: { $avg: '$weightage' },
        totalWeightage: { $sum: '$weightage' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return stats;
};

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;