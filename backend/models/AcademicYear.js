const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL'],
    required: true
  },
  terms: [{
    name: {
      type: String,
      required: true
    },
    startDate: Date,
    endDate: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);