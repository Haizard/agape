/**
 * Script to test the login API with emailOrUsername parameter
 */
require('dotenv').config();
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000';
const TEST_CREDENTIALS = [
  { emailOrUsername: 'admin2', password: 'admin123' },
  { emailOrUsername: 'admin', password: 'admin123' },
  { emailOrUsername: 'teacher1', password: 'teacher123' }
];

async function testLogin(credentials) {
  console.log(`Testing login for user: ${credentials.emailOrUsername}`);
  
  try {
    console.log('Sending request with data:', credentials);
    const response = await axios.post(`${API_URL}/api/users/login`, credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Login failed!');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. The server might be down.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

async function main() {
  console.log('Starting login tests with emailOrUsername parameter...');
  
  for (const credentials of TEST_CREDENTIALS) {
    console.log('\n-----------------------------------');
    await testLogin(credentials);
    console.log('-----------------------------------\n');
  }
  
  console.log('All login tests completed.');
}

// Run the tests
main().catch(error => {
  console.error('Unhandled error:', error);
});
