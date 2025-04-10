/**
 * Deployment environment check script
 * 
 * This script checks the deployment environment and verifies that
 * all required environment variables are set correctly.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Check environment variables
async function checkEnvironment() {
  console.log('Checking deployment environment...');
  
  // Required environment variables
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT'
  ];
  
  // Optional environment variables with defaults
  const optionalVars = {
    'NODE_ENV': 'development',
    'USE_MOCK_DATA': 'false'
  };
  
  // Check required variables
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    return false;
  }
  
  // Check optional variables
  for (const [varName, defaultValue] of Object.entries(optionalVars)) {
    if (!process.env[varName]) {
      console.warn(`Optional environment variable ${varName} not set. Using default: ${defaultValue}`);
    }
  }
  
  console.log('Environment variables check passed.');
  
  // Check MongoDB connection
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB connection successful!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
  
  // Check server health
  try {
    console.log('Testing server health...');
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
    const response = await axios.get(`${apiUrl}/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('Server health check passed!');
    } else {
      console.error('Server health check failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Server health check failed:', error.message);
    return false;
  }
  
  console.log('All deployment checks passed!');
  return true;
}

// Run the checks
checkEnvironment()
  .then(success => {
    if (!success) {
      console.error('Deployment environment check failed!');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error during deployment check:', err);
    process.exit(1);
  });
