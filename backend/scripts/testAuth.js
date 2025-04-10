/**
 * Test script to check authentication
 * 
 * This script tests the authentication flow by:
 * 1. Attempting to login with provided credentials
 * 2. Using the returned token to make an authenticated request
 * 
 * Usage: node scripts/testAuth.js <username> <password>
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get API URL from environment or use default
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Get credentials from command line arguments
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Usage: node scripts/testAuth.js <username> <password>');
  process.exit(1);
}

async function testAuthentication() {
  try {
    console.log('Testing authentication flow...');
    console.log(`API URL: ${API_URL}`);
    console.log(`Username: ${username}`);
    
    // Step 1: Login
    console.log('\n1. Attempting login...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      emailOrUsername: username,
      password: password
    });
    
    console.log('Login successful!');
    console.log('Response status:', loginResponse.status);
    
    // Extract token and user info
    const { token, user } = loginResponse.data;
    console.log('User:', {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    });
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Step 2: Test auth endpoint
    console.log('\n2. Testing auth-test endpoint...');
    const authTestResponse = await axios.get(`${API_URL}/auth-test`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Auth test successful!');
    console.log('Response:', authTestResponse.data);
    
    // Step 3: Test a protected endpoint
    console.log('\n3. Testing a protected endpoint (education-levels)...');
    const educationLevelsResponse = await axios.get(`${API_URL}/education-levels`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Protected endpoint request successful!');
    console.log('Response status:', educationLevelsResponse.status);
    console.log('Number of education levels:', educationLevelsResponse.data.length);
    
    console.log('\nAll tests passed successfully!');
    return true;
  } catch (error) {
    console.error('\nAuthentication test failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return false;
  }
}

// Run the test
testAuthentication()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
