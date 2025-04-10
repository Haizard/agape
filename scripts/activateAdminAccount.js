/**
 * Script to activate the admin2 account
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
  activateAdminAccount();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function activateAdminAccount() {
  try {
    console.log('Activating admin2 account...');
    
    // Find the admin2 user
    const adminUser = await User.findOne({ username: 'admin2' });
    
    if (!adminUser) {
      console.error('Admin user "admin2" not found');
      process.exit(1);
    }
    
    console.log(`Found user: ${adminUser.username} (${adminUser._id})`);
    console.log(`Current status: ${adminUser.status}`);
    
    // Update the status to 'active'
    adminUser.status = 'active';
    await adminUser.save();
    
    console.log(`Updated status to: ${adminUser.status}`);
    console.log('Admin account activation completed');
    
    // Verify the change
    const updatedUser = await User.findOne({ username: 'admin2' });
    console.log(`Verified status: ${updatedUser.status}`);
    
  } catch (err) {
    console.error('Error activating admin account:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}
