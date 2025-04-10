const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentFee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentFee',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'mobile_money', 'credit_card', 'other'],
    required: true
  },
  referenceNumber: {
    type: String,
    unique: true,
    required: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    required: true
  },
  description: String,
  feeComponentPayments: [{
    feeComponentId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quickbooksPaymentId: String,
  quickbooksSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },
  quickbooksSyncError: String
}, {
  timestamps: true
});

// Create indexes
paymentSchema.index({ referenceNumber: 1 }, { unique: true });
paymentSchema.index({ receiptNumber: 1 }, { unique: true });
paymentSchema.index({ student: 1, academicYear: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
