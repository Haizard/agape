const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feeComponentSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  optional: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['tuition', 'boarding', 'transport', 'examination', 'development', 'other'],
    default: 'other'
  }
});

const feeTemplateSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  components: [feeComponentSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  applicableClasses: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  academicYear: {
    type: Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Pre-save hook to calculate total amount
feeTemplateSchema.pre('save', function(next) {
  if (this.components && this.components.length > 0) {
    this.totalAmount = this.components.reduce((total, component) => {
      return total + component.amount;
    }, 0);
  } else {
    this.totalAmount = 0;
  }
  
  this.updatedAt = new Date();
  next();
});

const FeeTemplate = mongoose.model('FeeTemplate', feeTemplateSchema);

module.exports = FeeTemplate;
