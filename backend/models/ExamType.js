const mongoose = require('mongoose');

const examTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ExamType', examTypeSchema);