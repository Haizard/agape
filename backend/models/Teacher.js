const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Making userId optional
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contactNumber: String,
  dateOfBirth: Date,
  gender: String,
  address: String,
  qualification: {
    type: String,
    required: true
  },
  specialization: String,
  experience: {
    type: String,
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  joiningDate: {
    type: Date,
    default: Date.now
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  salary: Number,
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);
