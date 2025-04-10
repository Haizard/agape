/**
 * Script to activate all users
 * 
 * This script will:
 * 1. Find all users in the database
 * 2. Set their status to 'active'
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  activateAllUsers();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function activateAllUsers() {
  try {
    console.log('Activating all users...');
    
    // Find all users
    const users = await User.find({});
    
    console.log(`Found ${users.length} users`);
    
    // Count of users that need activation
    let activationCount = 0;
    
    // Update each user
    for (const user of users) {
      console.log(`Processing user: ${user.username} (${user._id})`);
      console.log(`Current status: ${user.status || 'undefined'}`);
      
      // Set status to 'active' if not already
      if (user.status !== 'active') {
        user.status = 'active';
        await user.save();
        console.log(`Updated status to: active`);
        activationCount++;
      } else {
        console.log('Status already active, no change needed');
      }
    }
    
    console.log(`Activation completed. ${activationCount} users were activated.`);
  } catch (err) {
    console.error('Error activating users:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}
