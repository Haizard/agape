/**
 * Test script to verify the API proxy is working correctly
 */
const axios = require('axios');

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://agape-school-system.onrender.com';
const BACKEND_URL = process.env.BACKEND_URL || 'https://agape-render.onrender.com';
const API_ENDPOINTS = [
  '/api/academic-years',
  '/api/new-academic-years',
  '/api/users/profile',
  '/api/classes',
  '/api/students'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test direct backend access
async function testDirectBackend() {
  console.log(`${colors.cyan}Testing direct backend access...${colors.reset}`);
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const url = `${BACKEND_URL}${endpoint}`;
      console.log(`${colors.yellow}Testing: ${url}${colors.reset}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`${colors.green}✓ Success: ${url} - Status: ${response.status}${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${endpoint} - ${error.message}${colors.reset}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

// Test frontend proxy
async function testFrontendProxy() {
  console.log(`\n${colors.cyan}Testing frontend proxy...${colors.reset}`);
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const url = `${FRONTEND_URL}${endpoint}`;
      console.log(`${colors.yellow}Testing: ${url}${colors.reset}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`${colors.green}✓ Success: ${url} - Status: ${response.status}${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${endpoint} - ${error.message}${colors.reset}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

// Run tests
async function runTests() {
  console.log(`${colors.magenta}API Proxy Test${colors.reset}`);
  console.log(`${colors.blue}Frontend URL: ${FRONTEND_URL}${colors.reset}`);
  console.log(`${colors.blue}Backend URL: ${BACKEND_URL}${colors.reset}`);
  
  await testDirectBackend();
  await testFrontendProxy();
  
  console.log(`\n${colors.magenta}Test Complete${colors.reset}`);
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
