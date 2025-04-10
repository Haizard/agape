const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  feeComponents: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String,
    dueDate: Date,
    isOptional: {
      type: Boolean,
      default: false
    },
    quickbooksAccountId: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeTemplate'
  }
}, {
  timestamps: true
});

// Create a compound index for academic year and class
feeStructureSchema.index({ academicYear: 1, class: 1 }, { unique: true });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
module.exports = FeeStructure;
