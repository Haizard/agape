/**
 * MessageBird SMS Provider
 * This module handles sending SMS messages using the MessageBird API
 */
const axios = require('axios');

// MessageBird configuration
const MESSAGEBIRD_CONFIG = {
  apiKey: process.env.MESSAGEBIRD_API_KEY || '',
  originator: process.env.SMS_SENDER_ID || 'SCHOOL',
  apiUrl: 'https://rest.messagebird.com/messages'
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
 * Send an SMS using MessageBird
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the MessageBird response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via MessageBird to ${formattedNumber}: ${message}`);
    
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
    
    // Check if MessageBird credentials are configured
    if (!MESSAGEBIRD_CONFIG.apiKey) {
      throw new Error('MessageBird credentials not configured. Please set MESSAGEBIRD_API_KEY in environment variables.');
    }
    
    // Create the request body
    const requestBody = {
      recipients: formattedNumber,
      originator: MESSAGEBIRD_CONFIG.originator,
      body: message
    };
    
    // Send the request to MessageBird
    const response = await axios.post(MESSAGEBIRD_CONFIG.apiUrl, requestBody, {
      headers: {
        'Authorization': `AccessKey ${MESSAGEBIRD_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check if the request was successful
    if (response.data && response.data.id) {
      return {
        success: true,
        messageId: response.data.id,
        to: formattedNumber,
        status: response.data.status || 'sent',
        cost: response.data.price ? response.data.price.amount : '0.0'
      };
    } else {
      throw new Error(`MessageBird API error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error sending SMS via MessageBird:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
