/**
 * Script to fix all admin users
 * 
 * This script will:
 * 1. Find all users with role 'admin'
 * 2. Set their status to 'active'
 * 3. Ensure they have the correct role
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
  fixAllAdminUsers();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function fixAllAdminUsers() {
  try {
    console.log('Fixing all admin users...');
    
    // Find all users with role containing 'admin' (case-insensitive)
    const adminUsers = await User.find({
      role: { $regex: 'admin', $options: 'i' }
    });
    
    console.log(`Found ${adminUsers.length} admin users`);
    
    // Update each admin user
    for (const user of adminUsers) {
      console.log(`Processing user: ${user.username} (${user._id})`);
      console.log(`Current role: ${user.role}, status: ${user.status}`);
      
      // Normalize role to 'admin'
      if (user.role.toLowerCase() !== 'admin') {
        user.role = 'admin';
        console.log(`Updated role to: admin`);
      }
      
      // Set status to 'active'
      if (user.status !== 'active') {
        user.status = 'active';
        console.log(`Updated status to: active`);
      }
      
      // Save the changes
      await user.save();
      console.log(`User ${user.username} updated successfully`);
    }
    
    // Also check for admin2 user specifically
    const admin2User = await User.findOne({ username: 'admin2' });
    if (admin2User) {
      console.log(`Found admin2 user: ${admin2User._id}`);
      console.log(`Current role: ${admin2User.role}, status: ${admin2User.status}`);
      
      // Ensure admin2 has role 'admin' and status 'active'
      admin2User.role = 'admin';
      admin2User.status = 'active';
      await admin2User.save();
      
      console.log(`Updated admin2 user: role=${admin2User.role}, status=${admin2User.status}`);
    } else {
      console.log('admin2 user not found');
    }
    
    console.log('All admin users fixed successfully');
  } catch (err) {
    console.error('Error fixing admin users:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}
