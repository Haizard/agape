const mongoose = require('mongoose');

const quickbooksConfigSchema = new mongoose.Schema({
  isConfigured: {
    type: Boolean,
    default: false
  },
  environment: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  },
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  redirectUri: {
    type: String,
    required: true
  },
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  realmId: String,
  lastSyncDate: Date,
  accountMappings: {
    tuitionFees: String,
    libraryFees: String,
    examFees: String,
    transportFees: String,
    uniformFees: String,
    otherFees: String,
    cashAccount: String,
    bankAccount: String,
    mobileMoney: String
  },
  syncSettings: {
    autoSyncEnabled: {
      type: Boolean,
      default: false
    },
    syncFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    lastSyncStatus: {
      type: String,
      enum: ['success', 'failed', 'in_progress', 'not_started'],
      default: 'not_started'
    },
    lastSyncError: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one configuration document exists
quickbooksConfigSchema.statics.getConfig = async function() {
  const config = await this.findOne();
  if (config) {
    return config;
  }
  
  // Create default config if none exists
  return this.create({
    isConfigured: false,
    environment: 'sandbox',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    syncSettings: {
      autoSyncEnabled: false,
      syncFrequency: 'daily',
      lastSyncStatus: 'not_started'
    }
  });
};

const QuickbooksConfig = mongoose.model('QuickbooksConfig', quickbooksConfigSchema);
module.exports = QuickbooksConfig;
