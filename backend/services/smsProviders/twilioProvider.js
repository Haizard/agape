/**
 * Twilio SMS Provider
 * This module handles sending SMS messages using the Twilio API
 */
const axios = require('axios');

// Twilio configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  baseUrl: `https://api.twilio.com/2010-04-01/Accounts/`
};

/**
 * Format a phone number for Twilio (E.164 format)
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - The formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number doesn't start with a plus, add the Tanzania country code
  if (!phoneNumber.startsWith('+')) {
    // If the number starts with 0, replace it with the Tanzania country code
    if (cleaned.startsWith('0')) {
      cleaned = '255' + cleaned.substring(1);
    } 
    // If the number doesn't have a country code, add the Tanzania country code
    else if (!cleaned.startsWith('255')) {
      cleaned = '255' + cleaned;
    }
    
    // Add the plus sign
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send an SMS using Twilio
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - A promise that resolves with the Twilio response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Log the SMS details
    console.log(`Sending SMS via Twilio to ${formattedNumber}: ${message}`);
    
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
    
    // Check if Twilio credentials are configured
    if (!TWILIO_CONFIG.accountSid || !TWILIO_CONFIG.authToken || !TWILIO_CONFIG.phoneNumber) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.');
    }
    
    // Create the URL for the Twilio API
    const url = `${TWILIO_CONFIG.baseUrl}${TWILIO_CONFIG.accountSid}/Messages.json`;
    
    // Create the request body
    const formData = new URLSearchParams();
    formData.append('To', formattedNumber);
    formData.append('From', TWILIO_CONFIG.phoneNumber);
    formData.append('Body', message);
    
    // Send the request to Twilio
    const response = await axios.post(url, formData, {
      auth: {
        username: TWILIO_CONFIG.accountSid,
        password: TWILIO_CONFIG.authToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Return the response
    return {
      success: true,
      messageId: response.data.sid,
      to: response.data.to,
      status: response.data.status,
      cost: response.data.price || '0.0'
    };
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
  formatPhoneNumber
};
