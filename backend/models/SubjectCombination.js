const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subjectCombinationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  educationLevel: {
    type: String,
    enum: ['A_LEVEL'],
    default: 'A_LEVEL'
  },
  description: String,
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  compulsorySubjects: [{
    type: Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('SubjectCombination', subjectCombinationSchema);
