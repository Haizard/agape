/**
 * Africa's Talking SMS Provider
 * This module handles sending SMS messages using the Africa's Talking API
 */
const axios = require('axios');

// Africa's Talking configuration
const AT_CONFIG = {
  apiKey: process.env.AT_API_KEY || 'your-sandbox-api-key',
  username: process.env.AT_USERNAME || 'sandbox', // Use 'sandbox' for testing
  sender: process.env.SMS_SENDER_ID || 'SCHOOL',
  baseUrl: process.env.AT_API_URL || 'https://api.africastalking.com/version1/messaging'
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
  
  // Add the plus sign
  return '+' + cleaned;
};

/**
 * Send an SMS using Africa's Talking
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the Africa's Talking response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via Africa's Talking to ${formattedNumber}: ${message}`);
    
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
    
    // Check if Africa's Talking credentials are configured
    if (!AT_CONFIG.apiKey || !AT_CONFIG.username) {
      throw new Error('Africa\'s Talking credentials not configured. Please set AT_API_KEY and AT_USERNAME in environment variables.');
    }
    
    // Create the request body
    const requestBody = {
      username: AT_CONFIG.username,
      to: formattedNumber,
      message: message,
      from: AT_CONFIG.sender
    };
    
    // Send the request to Africa's Talking
    const response = await axios.post(AT_CONFIG.baseUrl, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_CONFIG.apiKey
      }
    });
    
    // Check if the request was successful
    if (response.data && response.data.SMSMessageData && response.data.SMSMessageData.Recipients) {
      const recipient = response.data.SMSMessageData.Recipients[0];
      return {
        success: true,
        messageId: recipient.messageId,
        to: recipient.number,
        status: recipient.status,
        cost: recipient.cost
      };
    } else {
      throw new Error(`Africa's Talking API error: ${response.data?.SMSMessageData?.Message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error sending SMS via Africa\'s Talking:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
