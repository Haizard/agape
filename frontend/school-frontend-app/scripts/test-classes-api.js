/**
 * Script to test the classes API endpoint
 * 
 * This script tests the connection to the classes API endpoint
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

// Test classes endpoint
async function testClassesEndpoint(token) {
  try {
    console.log('\nTesting classes endpoint...');
    const response = await axios.get(`${apiUrl}/classes`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Classes endpoint response status:', response.status);
    console.log('Number of classes:', response.data.length);
    console.log('Classes:', response.data.map(cls => cls.name));
    
    return true;
  } catch (error) {
    console.error('Classes endpoint error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main function
async function main() {
  // Prompt for credentials
  rl.question('\nEnter username or email: ', (username) => {
    rl.question('Enter password: ', async (password) => {
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
        
        // Test classes endpoint with the token
        const token = response.data.token;
        await testClassesEndpoint(token);
      } catch (error) {
        console.error('Authentication error:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      } finally {
        rl.close();
      }
    });
  });
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  rl.close();
});
