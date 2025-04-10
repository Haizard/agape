/**
 * Bongolive SMS Provider
 * This module handles sending SMS messages using the Bongolive API
 * Bongolive is a Tanzania-specific SMS provider
 */
const axios = require('axios');

// Bongolive configuration
const BONGOLIVE_CONFIG = {
  username: process.env.BONGOLIVE_USERNAME || '',
  password: process.env.BONGOLIVE_PASSWORD || '',
  apiUrl: process.env.BONGOLIVE_API_URL || 'https://api.bongolive.co.tz/v1/sendSMS',
  senderId: process.env.SMS_SENDER_ID || 'SCHOOL'
};

/**
 * Format a phone number for Bongolive
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
 * Send an SMS using Bongolive
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the Bongolive response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via Bongolive to ${formattedNumber}: ${message}`);
    
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
    
    // Check if Bongolive credentials are configured
    if (!BONGOLIVE_CONFIG.username || !BONGOLIVE_CONFIG.password) {
      throw new Error('Bongolive credentials not configured. Please set BONGOLIVE_USERNAME and BONGOLIVE_PASSWORD in environment variables.');
    }
    
    // Create the request body
    const requestBody = {
      username: BONGOLIVE_CONFIG.username,
      password: BONGOLIVE_CONFIG.password,
      senderId: BONGOLIVE_CONFIG.senderId,
      messageType: 'text',
      mobile: formattedNumber,
      message: message
    };
    
    // Send the request to Bongolive
    const response = await axios.post(BONGOLIVE_CONFIG.apiUrl, requestBody);
    
    // Check if the request was successful
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        messageId: response.data.messageId || `bongolive-${Date.now()}`,
        to: formattedNumber,
        status: 'sent',
        cost: response.data.cost || '0.0'
      };
    } else {
      throw new Error(`Bongolive API error: ${response.data?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error sending SMS via Bongolive:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
