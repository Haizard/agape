/**
 * TextMagic SMS Provider
 * This module handles sending SMS messages using the TextMagic API
 */
const axios = require('axios');

// TextMagic configuration
const TEXTMAGIC_CONFIG = {
  username: process.env.TEXTMAGIC_USERNAME || '',
  apiKey: process.env.TEXTMAGIC_API_KEY || '',
  sender: process.env.SMS_SENDER_ID || 'SCHOOL',
  apiUrl: 'https://rest.textmagic.com/api/v2/messages'
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
 * Send an SMS using TextMagic
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the TextMagic response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via TextMagic to ${formattedNumber}: ${message}`);
    
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
    
    // Check if TextMagic credentials are configured
    if (!TEXTMAGIC_CONFIG.username || !TEXTMAGIC_CONFIG.apiKey) {
      throw new Error('TextMagic credentials not configured. Please set TEXTMAGIC_USERNAME and TEXTMAGIC_API_KEY in environment variables.');
    }
    
    // Create the request body
    const requestBody = new URLSearchParams();
    requestBody.append('phones', formattedNumber);
    requestBody.append('text', message);
    requestBody.append('from', TEXTMAGIC_CONFIG.sender);
    
    // Create the auth string
    const auth = Buffer.from(`${TEXTMAGIC_CONFIG.username}:${TEXTMAGIC_CONFIG.apiKey}`).toString('base64');
    
    // Send the request to TextMagic
    const response = await axios.post(TEXTMAGIC_CONFIG.apiUrl, requestBody, {
      headers: {
        'X-TM-Username': TEXTMAGIC_CONFIG.username,
        'X-TM-Key': TEXTMAGIC_CONFIG.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Check if the request was successful
    if (response.data && response.data.id) {
      return {
        success: true,
        messageId: response.data.id,
        to: formattedNumber,
        status: 'sent',
        cost: response.data.price || '0.0'
      };
    } else {
      throw new Error(`TextMagic API error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error sending SMS via TextMagic:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
