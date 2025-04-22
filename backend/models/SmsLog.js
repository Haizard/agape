/**
 * SMS Log Model
 * 
 * This model tracks all SMS messages sent through the system,
 * providing a history for auditing and troubleshooting.
 */
const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  // Recipient information
  recipient: {
    phoneNumber: {
      type: String,
      required: true
    },
    name: String
  },
  
  // Student and parent information (if applicable)
  student: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    name: String
  },
  parent: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParentContact'
    },
    name: String,
    relationship: String
  },
  
  // Message content and metadata
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['RESULT', 'NOTIFICATION', 'REMINDER', 'TEST', 'OTHER'],
    default: 'OTHER'
  },
  
  // Related data (if applicable)
  relatedData: {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear'
    }
  },
  
  // Sending details
  sentBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String
  },
  
  // Provider information
  provider: {
    name: {
      type: String,
      required: true
    },
    messageId: String,
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'MOCK'],
      default: 'PENDING'
    },
    statusDetails: String,
    cost: String
  },
  
  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  
  // Error information (if applicable)
  error: {
    message: String,
    code: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Create indexes for common queries
smsLogSchema.index({ 'student.id': 1 });
smsLogSchema.index({ 'parent.id': 1 });
smsLogSchema.index({ 'recipient.phoneNumber': 1 });
smsLogSchema.index({ 'provider.status': 1 });
smsLogSchema.index({ sentAt: -1 });
smsLogSchema.index({ messageType: 1 });

const SmsLog = mongoose.model('SmsLog', smsLogSchema);

module.exports = SmsLog;
