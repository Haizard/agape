/**
 * Vonage SMS Provider
 * This module handles sending SMS messages using the Vonage API
 * (formerly Nexmo)
 */
const axios = require('axios');

// Vonage configuration
const VONAGE_CONFIG = {
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
  brand: process.env.SMS_SENDER_ID || 'SCHOOL',
  apiUrl: 'https://rest.nexmo.com/sms/json'
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
 * Send an SMS using Vonage
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the Vonage response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via Vonage to ${formattedNumber}: ${message}`);
    
    // Check if SMS is enabled
    if (process.env.SMS_ENABLED !== 'true') {
      console.log('SMS sending is disabled. Enable by setting SMS_ENABLED=true in environment variables.');
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        to: formattedNumber,
        status: 'sent (mock)',
        cost: '0.0'
      };
    }
    
    // Check if Vonage credentials are configured
    if (!VONAGE_CONFIG.apiKey || !VONAGE_CONFIG.apiSecret) {
      throw new Error('Vonage credentials not configured. Please set VONAGE_API_KEY and VONAGE_API_SECRET in environment variables.');
    }
    
    // Create the request body
    const requestBody = {
      api_key: VONAGE_CONFIG.apiKey,
      api_secret: VONAGE_CONFIG.apiSecret,
      to: formattedNumber,
      from: VONAGE_CONFIG.brand,
      text: message
    };
    
    // Send the request to Vonage
    const response = await axios.post(VONAGE_CONFIG.apiUrl, requestBody);
    
    // Check if the request was successful
    if (response.data && response.data.messages && response.data.messages.length > 0) {
      const messageResult = response.data.messages[0];
      return {
        success: messageResult.status === '0',
        messageId: messageResult.message_id,
        to: formattedNumber,
        status: messageResult.status === '0' ? 'sent' : 'failed',
        cost: messageResult.message_price || '0.0'
      };
    } else {
      throw new Error(`Vonage API error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error sending SMS via Vonage:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
