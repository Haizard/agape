const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['CORE', 'OPTIONAL'],
    default: 'CORE'
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL', 'BOTH'],
    required: true,
    default: 'O_LEVEL'
  },
  isCompulsory: {
    type: Boolean,
    default: false
  },
  isPrincipal: {
    type: Boolean,
    default: false
  },
  subjectCombinations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectCombination'
  }],
  description: String,
  passMark: {
    type: Number,
    default: 40
  },
  gradingSystem: {
    type: Map,
    of: {
      type: Map,
      of: {
        type: { type: Number },
        min: { type: Number },
        max: { type: Number },
        points: { type: Number }
      }
    },
    default: {
      'O_LEVEL': {
        'A': { type: Number, min: 75, max: 100, points: 1 },
        'B': { type: Number, min: 65, max: 74, points: 2 },
        'C': { type: Number, min: 50, max: 64, points: 3 },
        'D': { type: Number, min: 30, max: 49, points: 4 },
        'F': { type: Number, min: 0, max: 29, points: 5 }
      },
      'A_LEVEL': {
        'A': { type: Number, min: 80, max: 100, points: 1 },
        'B': { type: Number, min: 70, max: 79, points: 2 },
        'C': { type: Number, min: 60, max: 69, points: 3 },
        'D': { type: Number, min: 50, max: 59, points: 4 },
        'E': { type: Number, min: 40, max: 49, points: 5 },
        'S': { type: Number, min: 35, max: 39, points: 6 },
        'F': { type: Number, min: 0, max: 34, points: 7 }
      }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
