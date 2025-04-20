/**
 * Test script for the /api/o-level/marks/check endpoint
 * 
 * This script makes a request to the endpoint and logs the response.
 * It can be run with Node.js to test if the endpoint is working correctly.
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000'; // Change this to match your server URL
const TOKEN = 'YOUR_JWT_TOKEN'; // Replace with a valid JWT token

// Test the test endpoint first
async function testEndpoints() {
  try {
    console.log('Testing /api/o-level/test endpoint...');
    const testResponse = await axios.get(`${API_URL}/api/o-level/test`);
    console.log('Test endpoint response:', testResponse.data);
    
    console.log('\nTesting /api/o-level/marks-check-test endpoint...');
    const marksCheckTestResponse = await axios.get(`${API_URL}/api/o-level/marks-check-test`);
    console.log('Marks check test endpoint response:', marksCheckTestResponse.data);
    
    // Now test the actual marks/check endpoint with sample parameters
    console.log('\nTesting /api/o-level/marks/check endpoint...');
    const marksCheckResponse = await axios.get(`${API_URL}/api/o-level/marks/check`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      params: {
        classId: '67fdfc962cc25690fef0298e', // Replace with a valid class ID
        subjectId: '67f2fd7fdcc60fd7fef2ef2c', // Replace with a valid subject ID
        examId: '67f60835dcc60fd7fef2ef4a' // Replace with a valid exam ID
      }
    });
    console.log('Marks check endpoint response:', marksCheckResponse.data);
    
  } catch (error) {
    console.error('Error testing endpoints:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the tests
testEndpoints();
