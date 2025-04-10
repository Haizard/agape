/**
 * Beem Africa SMS Provider
 * This module handles sending SMS messages using the Beem Africa API
 * Beem Africa is a Tanzania-based SMS provider with good local coverage
 */
const axios = require('axios');

// Beem Africa configuration
const BEEM_CONFIG = {
  apiKey: process.env.BEEM_API_KEY || '',
  secretKey: process.env.BEEM_SECRET_KEY || '',
  source: process.env.SMS_SENDER_ID || 'SCHOOL',
  apiUrl: 'https://apisms.beem.africa/v1/send',
  apiUrlV2: 'https://apisms.beem.africa/v1/send',
  callbackUrl: process.env.BEEM_CALLBACK_URL || ''
};

// Function to get settings from database
const getSettingsFromDb = async () => {
  try {
    // Try to import the Setting model
    const Setting = require('../../models/Setting');

    // Get SMS settings from database
    const smsSettings = await Setting.findOne({ key: 'sms' });

    if (smsSettings && smsSettings.value) {
      // Update the configuration with values from the database
      if (smsSettings.value.beemApiKey) {
        BEEM_CONFIG.apiKey = smsSettings.value.beemApiKey;
      }

      if (smsSettings.value.beemSecretKey) {
        BEEM_CONFIG.secretKey = smsSettings.value.beemSecretKey;
      }

      if (smsSettings.value.senderId) {
        BEEM_CONFIG.source = smsSettings.value.senderId;
      }
    }
  } catch (error) {
    // If there's an error (e.g., model not found), just use environment variables
    console.log('Using environment variables for Beem Africa configuration');
  }
};

/**
 * Format a phone number for Tanzania
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - The formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If the number starts with 0, replace it with the Tanzania country code
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.substring(1);
  }
  // If the number doesn't have a country code, add the Tanzania country code
  else if (!cleaned.startsWith('255')) {
    cleaned = '255' + cleaned;
  }

  return cleaned;
};

/**
 * Send an SMS using Beem Africa
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the Beem Africa response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Get settings from database
    await getSettingsFromDb();
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);

    // Log the SMS details
    console.log(`Sending SMS via Beem Africa to ${formattedNumber}: ${message}`);

    // Always use mock mode for testing
    console.log('SMS sending is in mock mode. Real SMS will not be sent.');
    // Simulate a delay to make it feel more realistic
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      to: formattedNumber,
      status: 'sent (mock)',
      cost: '0.0',
      provider: 'Beem Africa (Mock Mode)'
    };

    // Check if Beem Africa credentials are configured
    if (!BEEM_CONFIG.apiKey || !BEEM_CONFIG.secretKey) {
      throw new Error('Beem Africa credentials not configured. Please set BEEM_API_KEY and BEEM_SECRET_KEY in environment variables.');
    }

    // Beem Africa API authentication
    // According to Beem Africa documentation, we need to use API key and secret key in headers

    // Log the credentials for debugging
    console.log('API Key:', BEEM_CONFIG.apiKey);
    console.log('Secret Key:', BEEM_CONFIG.secretKey);

    // Create the request body for V1 API
    const requestBody = {
      source_addr: BEEM_CONFIG.source,
      schedule_time: '',
      encoding: '0',
      message: message,
      recipients: [
        {
          recipient_id: 1,
          dest_addr: formattedNumber
        }
      ],
      // Include callback URL if available
      dlr_callback: BEEM_CONFIG.callbackUrl || ''
    };

    // Create the auth string for Basic Auth
    const auth = Buffer.from(`${BEEM_CONFIG.apiKey}:${BEEM_CONFIG.secretKey}`).toString('base64');
    console.log('Auth string:', auth);

    // Send the request to Beem Africa using the V1 API
    const response = await axios.post(BEEM_CONFIG.apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    // Log the response for debugging
    console.log('Beem Africa API response:', JSON.stringify(response.data, null, 2));

    // Check if the request was successful (V2 API has a different response format)
    if (response.data) {
      // The V2 API might have a different success indicator
      if (response.data.code === 100 || response.data.status === 'success' || response.status === 200) {
        return {
          success: true,
          messageId: response.data.data?.message_id || `beem-${Date.now()}`,
          to: formattedNumber,
          status: 'sent',
          cost: response.data.data?.cost || '0.0'
        };
      }
    }

    // If we get here, there was an error
    throw new Error(`Beem Africa API error: ${response.data?.message || response.data?.error || 'Unknown error'}`);

  } catch (error) {
    console.error('Error sending SMS via Beem Africa:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
