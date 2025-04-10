/**
 * Script to test the connection to the API
 * 
 * This script tests the connection to the API specified in the .env.development file
 * and checks if authentication is working correctly.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Read API URL from .env.development file
const envPath = path.join(__dirname, '..', '.env.development');
let apiUrl = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/REACT_APP_API_URL=(.*)/);
  if (match && match[1]) {
    apiUrl = match[1].trim();
  }
} catch (error) {
  console.error('Error reading .env.development file:', error.message);
  process.exit(1);
}

if (!apiUrl) {
  console.error('Could not find REACT_APP_API_URL in .env.development file');
  process.exit(1);
}

console.log(`Testing connection to API: ${apiUrl}`);

// Test health endpoint
async function testHealth() {
  try {
    console.log('\nTesting health endpoint...');
    const response = await axios.get(`${apiUrl}/health`);
    console.log('Health endpoint response:', response.data);
    return true;
  } catch (error) {
    console.error('Health endpoint error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test authentication
async function testAuthentication(username, password) {
  try {
    console.log('\nTesting authentication...');
    const response = await axios.post(`${apiUrl}/users/login`, {
      emailOrUsername: username,
      password: password
    });
    
    console.log('Authentication successful!');
    console.log('User:', {
      id: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role
    });
    
    // Test a protected endpoint with the token
    const token = response.data.token;
    console.log('\nTesting protected endpoint (education-levels) with token...');
    
    const educationLevelsResponse = await axios.get(`${apiUrl}/education-levels`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Protected endpoint response status:', educationLevelsResponse.status);
    console.log('Number of education levels:', educationLevelsResponse.data.length);
    console.log('Education levels:', educationLevelsResponse.data.map(level => level.name));
    
    return true;
  } catch (error) {
    console.error('Authentication error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main function
async function main() {
  // Test health endpoint
  const healthResult = await testHealth();
  
  if (!healthResult) {
    console.error('\nHealth check failed. API may be down or unreachable.');
    rl.close();
    return;
  }
  
  // Prompt for credentials
  rl.question('\nEnter username or email: ', (username) => {
    rl.question('Enter password: ', async (password) => {
      // Test authentication
      await testAuthentication(username, password);
      rl.close();
    });
  });
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  rl.close();
});
