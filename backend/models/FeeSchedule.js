const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feeScheduleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  academicYear: {
    type: Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  installments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    }
  }],
  enableReminders: {
    type: Boolean,
    default: true
  },
  reminderDays: {
    type: Number,
    default: 7,
    min: 1,
    max: 30
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Validate that installment percentages add up to 100%
feeScheduleSchema.pre('save', function(next) {
  const totalPercentage = this.installments.reduce((sum, installment) => sum + installment.percentage, 0);
  
  if (totalPercentage !== 100) {
    return next(new Error(`Installment percentages must add up to 100%. Current total: ${totalPercentage}%`));
  }
  
  next();
});

module.exports = mongoose.model('FeeSchedule', feeScheduleSchema);
