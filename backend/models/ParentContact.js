const mongoose = require('mongoose');

const parentContactSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  parentName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Basic phone number validation - can be customized for Tanzania's format
        return /^\+?[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  relationship: {
    type: String,
    enum: ['Father', 'Mother', 'Guardian', 'Other'],
    default: 'Guardian'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
parentContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ParentContact = mongoose.model('ParentContact', parentContactSchema);

module.exports = ParentContact;
