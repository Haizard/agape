/**
 * Script to test login with inactive users
 * 
 * This script will:
 * 1. Create a test user with inactive status
 * 2. Attempt to log in with the test user
 * 3. Verify that the login is successful
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');
const User = require('../models/User');

// Configuration
const API_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'testinactive',
  email: 'testinactive@example.com',
  password: 'test123',
  role: 'teacher',
  status: 'inactive'
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  runTest();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function createTestUser() {
  try {
    // Check if the test user already exists
    let user = await User.findOne({ username: TEST_USER.username });
    
    if (user) {
      console.log(`Test user ${TEST_USER.username} already exists`);
      
      // Ensure the user has inactive status
      if (user.status !== 'inactive') {
        user.status = 'inactive';
        await user.save();
        console.log(`Updated test user status to inactive`);
      }
      
      return user;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_USER.password, salt);
    
    // Create the test user
    user = new User({
      username: TEST_USER.username,
      email: TEST_USER.email,
      password: hashedPassword,
      role: TEST_USER.role,
      status: TEST_USER.status
    });
    
    await user.save();
    console.log(`Created test user: ${user.username} with status: ${user.status}`);
    
    return user;
  } catch (err) {
    console.error('Error creating test user:', err);
    throw err;
  }
}

async function testLogin(credentials) {
  console.log(`Testing login for user: ${credentials.username}`);
  
  try {
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
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. The server might be down.');
    } else {
      console.error('Error message:', error.message);
    }
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

async function checkUserStatus(username) {
  try {
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`User ${username} not found`);
      return null;
    }
    
    console.log(`User ${username} status: ${user.status}`);
    return user.status;
  } catch (err) {
    console.error('Error checking user status:', err);
    return null;
  }
}

async function runTest() {
  try {
    // Create a test user with inactive status
    const user = await createTestUser();
    
    // Verify the user has inactive status
    console.log(`Test user ${user.username} has status: ${user.status}`);
    
    // Attempt to log in with the test user
    const loginResult = await testLogin({
      emailOrUsername: TEST_USER.username,
      password: TEST_USER.password
    });
    
    // Check if the login was successful
    if (loginResult.success) {
      console.log('Login test passed: Inactive user was able to log in');
      
      // Check if the user's status was updated
      const newStatus = await checkUserStatus(TEST_USER.username);
      
      if (newStatus === 'active') {
        console.log('Status update test passed: User status was updated to active');
      } else {
        console.log('Status update test failed: User status was not updated to active');
      }
    } else {
      console.log('Login test failed: Inactive user was not able to log in');
    }
    
    console.log('Test completed');
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}
