const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Scholarship Schema
 * 
 * This model represents scholarships and discounts that can be applied to student fees.
 * It supports both percentage-based and fixed amount discounts, and can be applied
 * to specific fee components or the entire fee structure.
 */
const scholarshipSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  maxAmount: {
    type: Number,
    min: 0,
    default: null
  },
  academicYear: {
    type: Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  applicableFeeComponents: [{
    type: String,
    trim: true
  }],
  applicableClasses: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  requiresApproval: {
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
}, {
  timestamps: true
});

// Create index for academic year
scholarshipSchema.index({ academicYear: 1, name: 1 }, { unique: true });

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
module.exports = Scholarship;
