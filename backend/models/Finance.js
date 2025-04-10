const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  position: {
    type: String,
    required: true,
    enum: ['accountant', 'finance_manager', 'bursar', 'cashier']
  },
  department: {
    type: String,
    default: 'Finance'
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  },
  quickbooksAccess: {
    isAuthorized: {
      type: Boolean,
      default: false
    },
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    realmId: String
  }
}, {
  timestamps: true
});

// Add indexes
financeSchema.index({ userId: 1 }, { unique: true });
financeSchema.index({ employeeId: 1 }, { unique: true });

const Finance = mongoose.model('Finance', financeSchema);
module.exports = Finance;
