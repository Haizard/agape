const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const educationLevelSchema = new Schema({
  name: {
    type: String,
    required: true,
    enum: ['O_LEVEL', 'A_LEVEL'],
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  gradingSystem: {
    type: Map,
    of: {
      type: Map,
      of: {
        min: { type: Number },
        max: { type: Number },
        points: { type: Number }
      }
    },
    default: {
      'O_LEVEL': {
        'A': { min: 75, max: 100, points: 1 },
        'B': { min: 65, max: 74, points: 2 },
        'C': { min: 45, max: 64, points: 3 },
        'D': { min: 30, max: 44, points: 4 },
        'F': { min: 0, max: 29, points: 5 }
      },
      'A_LEVEL': {
        'A': { min: 80, max: 100, points: 1 },
        'B': { min: 70, max: 79, points: 2 },
        'C': { min: 60, max: 69, points: 3 },
        'D': { min: 50, max: 59, points: 4 },
        'E': { min: 40, max: 49, points: 5 },
        'S': { min: 35, max: 39, points: 6 },
        'F': { min: 0, max: 34, points: 7 }
      }
    }
  },
  divisionRanges: {
    type: Map,
    of: [
      {
        division: { type: String },
        min: { type: Number },
        max: { type: Number }
      }
    ],
    default: {
      'O_LEVEL': [
        { division: 'I', min: 7, max: 17 },
        { division: 'II', min: 18, max: 21 },
        { division: 'III', min: 22, max: 25 },
        { division: 'IV', min: 26, max: 33 },
        { division: '0', min: 34, max: 36 }
      ],
      'A_LEVEL': [
        { division: 'I', min: 3, max: 9 },
        { division: 'II', min: 10, max: 12 },
        { division: 'III', min: 13, max: 17 },
        { division: 'IV', min: 18, max: 19 },
        { division: '0', min: 20, max: 21 }
      ]
    }
  },
  subjectCount: {
    type: Map,
    of: {
      best: { type: Number }
    },
    default: {
      'O_LEVEL': { best: 7 },
      'A_LEVEL': { best: 3 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('EducationLevel', educationLevelSchema);
