/**
 * ClickSend SMS Provider
 * This module handles sending SMS messages using the ClickSend API
 */
const axios = require('axios');

// ClickSend configuration
const CLICKSEND_CONFIG = {
  username: process.env.CLICKSEND_USERNAME || '',
  apiKey: process.env.CLICKSEND_API_KEY || '',
  sender: process.env.SMS_SENDER_ID || 'SCHOOL',
  apiUrl: 'https://rest.clicksend.com/v3/sms/send'
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
  
  // Add the plus sign for ClickSend
  return '+' + cleaned;
};

/**
 * Send an SMS using ClickSend
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the ClickSend response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via ClickSend to ${formattedNumber}: ${message}`);
    
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
    
    // Check if ClickSend credentials are configured
    if (!CLICKSEND_CONFIG.username || !CLICKSEND_CONFIG.apiKey) {
      throw new Error('ClickSend credentials not configured. Please set CLICKSEND_USERNAME and CLICKSEND_API_KEY in environment variables.');
    }
    
    // Create the request body
    const requestBody = {
      messages: [
        {
          source: 'sdk',
          from: CLICKSEND_CONFIG.sender,
          body: message,
          to: formattedNumber
        }
      ]
    };
    
    // Create the auth string
    const auth = Buffer.from(`${CLICKSEND_CONFIG.username}:${CLICKSEND_CONFIG.apiKey}`).toString('base64');
    
    // Send the request to ClickSend
    const response = await axios.post(CLICKSEND_CONFIG.apiUrl, requestBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check if the request was successful
    if (response.data && response.data.data && response.data.data.messages && response.data.data.messages.length > 0) {
      const messageResult = response.data.data.messages[0];
      return {
        success: response.data.response_code === 'SUCCESS',
        messageId: messageResult.message_id,
        to: formattedNumber,
        status: messageResult.status,
        cost: messageResult.price || '0.0'
      };
    } else {
      throw new Error(`ClickSend API error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error sending SMS via ClickSend:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
