/**
 * SMS Configuration Service
 *
 * This file centralizes SMS configuration management to ensure consistency
 * across the application and reduce direct environment variable access.
 */
const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const schoolConfig = require('./schoolConfig');
const logger = require('../utils/logger');

// Default configuration values
const DEFAULT_CONFIG = {
  enabled: process.env.SMS_ENABLED === 'true' || false,
  provider: process.env.SMS_PROVIDER || 'africasTalking',
  senderId: process.env.SMS_SENDER_ID || 'SCHOOL',
  schoolName: process.env.SCHOOL_NAME || schoolConfig.shortName,
  mockMode: process.env.SMS_MOCK_MODE === 'true' || false,
  
  // Provider-specific settings with defaults from environment variables
  providers: {
    africasTalking: {
      apiKey: process.env.AT_API_KEY || '',
      username: process.env.AT_USERNAME || 'sandbox',
      baseUrl: process.env.AT_API_URL || 'https://api.africastalking.com/version1/messaging'
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      baseUrl: 'https://api.twilio.com/2010-04-01/Accounts/'
    },
    bongolive: {
      username: process.env.BONGOLIVE_USERNAME || '',
      password: process.env.BONGOLIVE_PASSWORD || '',
      apiUrl: process.env.BONGOLIVE_API_URL || 'https://api.bongolive.co.tz/v1/sendSMS'
    },
    vonage: {
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      apiUrl: 'https://rest.nexmo.com/sms/json'
    },
    messagebird: {
      apiKey: process.env.MESSAGEBIRD_API_KEY || '',
      apiUrl: 'https://rest.messagebird.com/messages'
    },
    clicksend: {
      username: process.env.CLICKSEND_USERNAME || '',
      apiKey: process.env.CLICKSEND_API_KEY || '',
      apiUrl: 'https://rest.clicksend.com/v3/sms/send'
    },
    textmagic: {
      username: process.env.TEXTMAGIC_USERNAME || '',
      apiKey: process.env.TEXTMAGIC_API_KEY || '',
      apiUrl: 'https://rest.textmagic.com/api/v2/messages'
    },
    beemafrica: {
      apiKey: process.env.BEEM_API_KEY || '',
      secretKey: process.env.BEEM_SECRET_KEY || '',
      apiUrl: 'https://apisms.beem.africa/v1/send'
    }
  }
};

// Cache for the configuration to avoid frequent database lookups
let configCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the SMS configuration from the database or environment variables
 * @returns {Promise<Object>} - The SMS configuration
 */
const getSmsConfig = async () => {
  try {
    // Return cached config if it's still valid
    const now = Date.now();
    if (configCache && cacheExpiry > now) {
      return configCache;
    }

    // Try to get configuration from database
    let config = DEFAULT_CONFIG;
    
    // Only query the database if mongoose is connected
    if (mongoose.connection.readyState === 1) {
      const dbSettings = await Setting.findOne({ key: 'sms' });
      
      if (dbSettings && dbSettings.value) {
        // Merge database settings with defaults
        config = {
          ...DEFAULT_CONFIG,
          enabled: dbSettings.value.enabled ?? DEFAULT_CONFIG.enabled,
          provider: dbSettings.value.provider ?? DEFAULT_CONFIG.provider,
          senderId: dbSettings.value.senderId ?? DEFAULT_CONFIG.senderId,
          schoolName: dbSettings.value.schoolName ?? DEFAULT_CONFIG.schoolName,
          mockMode: dbSettings.value.mockMode ?? DEFAULT_CONFIG.mockMode,
          
          // Update provider-specific settings
          providers: {
            ...DEFAULT_CONFIG.providers,
            africasTalking: {
              ...DEFAULT_CONFIG.providers.africasTalking,
              apiKey: dbSettings.value.apiKey || DEFAULT_CONFIG.providers.africasTalking.apiKey,
              username: dbSettings.value.username || DEFAULT_CONFIG.providers.africasTalking.username
            },
            twilio: {
              ...DEFAULT_CONFIG.providers.twilio,
              accountSid: dbSettings.value.accountSid || DEFAULT_CONFIG.providers.twilio.accountSid,
              authToken: dbSettings.value.authToken || DEFAULT_CONFIG.providers.twilio.authToken,
              phoneNumber: dbSettings.value.phoneNumber || DEFAULT_CONFIG.providers.twilio.phoneNumber
            },
            bongolive: {
              ...DEFAULT_CONFIG.providers.bongolive,
              username: dbSettings.value.bongoliveUsername || DEFAULT_CONFIG.providers.bongolive.username,
              password: dbSettings.value.bongolivePassword || DEFAULT_CONFIG.providers.bongolive.password
            },
            vonage: {
              ...DEFAULT_CONFIG.providers.vonage,
              apiKey: dbSettings.value.vonageApiKey || DEFAULT_CONFIG.providers.vonage.apiKey,
              apiSecret: dbSettings.value.vonageApiSecret || DEFAULT_CONFIG.providers.vonage.apiSecret
            },
            messagebird: {
              ...DEFAULT_CONFIG.providers.messagebird,
              apiKey: dbSettings.value.messageBirdApiKey || DEFAULT_CONFIG.providers.messagebird.apiKey
            },
            clicksend: {
              ...DEFAULT_CONFIG.providers.clicksend,
              username: dbSettings.value.clickSendUsername || DEFAULT_CONFIG.providers.clicksend.username,
              apiKey: dbSettings.value.clickSendApiKey || DEFAULT_CONFIG.providers.clicksend.apiKey
            },
            textmagic: {
              ...DEFAULT_CONFIG.providers.textmagic,
              username: dbSettings.value.textMagicUsername || DEFAULT_CONFIG.providers.textmagic.username,
              apiKey: dbSettings.value.textMagicApiKey || DEFAULT_CONFIG.providers.textmagic.apiKey
            },
            beemafrica: {
              ...DEFAULT_CONFIG.providers.beemafrica,
              apiKey: dbSettings.value.beemApiKey || DEFAULT_CONFIG.providers.beemafrica.apiKey,
              secretKey: dbSettings.value.beemSecretKey || DEFAULT_CONFIG.providers.beemafrica.secretKey
            }
          }
        };
      }
    }

    // Update the cache
    configCache = config;
    cacheExpiry = now + CACHE_TTL;
    
    return config;
  } catch (error) {
    logger.error('Error getting SMS configuration:', error);
    // Return default config if there's an error
    return DEFAULT_CONFIG;
  }
};

/**
 * Get the configuration for a specific SMS provider
 * @param {string} provider - The provider name
 * @returns {Promise<Object>} - The provider configuration
 */
const getProviderConfig = async (provider) => {
  const config = await getSmsConfig();
  const providerName = provider || config.provider;
  
  return {
    ...config.providers[providerName],
    enabled: config.enabled,
    mockMode: config.mockMode,
    senderId: config.senderId,
    schoolName: config.schoolName
  };
};

/**
 * Clear the configuration cache
 */
const clearConfigCache = () => {
  configCache = null;
  cacheExpiry = 0;
};

module.exports = {
  getSmsConfig,
  getProviderConfig,
  clearConfigCache
};
