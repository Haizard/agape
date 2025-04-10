/**
 * Test script for Beem Africa SMS service
 * This script tests sending an SMS using the Beem Africa provider
 */
require('dotenv').config();

// Set environment variables for testing
process.env.SMS_ENABLED = 'true';
process.env.SMS_PROVIDER = 'beemafrica';
process.env.SMS_MOCK_MODE = 'true';  // Enable mock mode for testing

// These are the credentials from the frontend
// Using the new API key provided by the user
process.env.BEEM_API_KEY = 'b72c52fb-7dd7-43ca-9f5c-e0cef2655773';

// The secret key might need to be in a different format
// Let's try a different format - Beem Africa might expect the raw secret key, not the base64 encoded version
// Try to decode the base64 string to get the raw secret key
try {
  const base64SecretKey = 'MjE0MjM1YzA3ZDJkZjIxNDIzNWMwN2QyZA==';
  // Try to decode it if it's base64
  const rawSecretKey = Buffer.from(base64SecretKey, 'base64').toString('utf-8');
  console.log('Decoded secret key:', rawSecretKey);
  process.env.BEEM_SECRET_KEY = rawSecretKey;
} catch (error) {
  // If decoding fails, use the original
  console.log('Using original secret key');
  process.env.BEEM_SECRET_KEY = 'MjE0MjM1YzA3ZDJkZjIxNDIzNWMwN2QyZA==';
}

// Set the sender ID
process.env.SMS_SENDER_ID = 'SCHOOL';

const beemAfricaProvider = require('../services/smsProviders/beemAfricaProvider');

// Test phone number (replace with a valid phone number for testing)
const TEST_PHONE_NUMBER = '+255693671032';
const TEST_MESSAGE = 'This is a test message from the school management system.';

/**
 * Test sending a simple SMS
 */
async function testSimpleSMS() {
  console.log('Testing Beem Africa SMS...');
  console.log(`Sending SMS to ${TEST_PHONE_NUMBER}: ${TEST_MESSAGE}`);

  // Log the configuration
  console.log('Beem Africa Configuration:');
  console.log('API Key:', process.env.BEEM_API_KEY);
  console.log('Secret Key:', process.env.BEEM_SECRET_KEY);
  console.log('Sender ID:', process.env.SMS_SENDER_ID);

  try {
    const result = await beemAfricaProvider.sendSMS(TEST_PHONE_NUMBER, TEST_MESSAGE);
    console.log('SMS sent successfully:', result);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

// Run the test
testSimpleSMS().catch(console.error);
