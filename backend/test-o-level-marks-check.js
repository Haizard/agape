/**
 * Test script for the /api/o-level/marks/check endpoint
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000';
const TOKEN = 'YOUR_JWT_TOKEN'; // Replace with a valid JWT token

// Test the endpoint
async function testEndpoint() {
  try {
    console.log('Testing /api/o-level/marks-check-test endpoint...');
    const testResponse = await axios.get(`${API_URL}/api/o-level/marks-check-test`);
    console.log('Test endpoint response:', testResponse.data);
    
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
    console.error('Error testing endpoint:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testEndpoint();
