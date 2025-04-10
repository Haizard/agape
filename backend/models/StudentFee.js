const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentFeeSchema = new Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  feeComponents: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      required: true
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending'
    },
    quickbooksAccountId: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quickbooksInvoiceId: String,
  reminders: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'both'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  feeSchedule: {
    type: Schema.Types.ObjectId,
    ref: 'FeeSchedule',
    default: null
  },
  installments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    amount: {
      type: Number,
      required: true
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: function() {
        return this.amount;
      }
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Create a compound index for student and academic year
studentFeeSchema.index({ student: 1, academicYear: 1 }, { unique: true });

// Pre-save middleware to calculate balance
studentFeeSchema.pre('save', function(next) {
  // Calculate balance for the overall fee
  this.balance = this.totalAmount - this.amountPaid;

  // Calculate balance for each fee component
  for (const component of this.feeComponents) {
    component.balance = component.amount - component.amountPaid;
  }

  // Calculate balance for each installment if using fee schedule
  if (this.installments && this.installments.length > 0) {
    for (const installment of this.installments) {
      installment.balance = installment.amount - installment.amountPaid;

      // Update installment status
      const currentDate = new Date();
      if (installment.balance === 0) {
        installment.status = 'paid';
      } else if (installment.amountPaid > 0) {
        installment.status = 'partial';
      } else if (installment.dueDate < currentDate) {
        installment.status = 'overdue';
      } else {
        installment.status = 'pending';
      }
    }
  }

  // Update overall status based on payment
  if (this.balance === 0) {
    this.status = 'paid';
  } else if (this.amountPaid > 0) {
    this.status = 'partial';
  } else if (this.dueDate < new Date()) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }

  next();
});

const StudentFee = mongoose.model('StudentFee', studentFeeSchema);
module.exports = StudentFee;
