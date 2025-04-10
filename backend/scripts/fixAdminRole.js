/**
 * Script to check and fix admin user roles
 *
 * This script will check if the admin2 user has the correct role set to 'admin'
 * and fix it if necessary.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function fixAdminRole() {
  try {
    console.log('Fixing admin user role...');

    // Find the admin2 user
    const adminUser = await User.findOne({ username: 'admin2' });

    if (!adminUser) {
      console.error('Admin user "admin2" not found.');
      process.exit(1);
    }

    console.log(`Found user: ${adminUser.username} (${adminUser._id})`);
    console.log(`Current role: ${adminUser.role}`);

    // Force update the role to 'admin' regardless of current value
    console.log('Forcing role update to admin...');

    // Use updateOne to bypass any middleware or validation
    const result = await User.updateOne(
      { _id: adminUser._id },
      { $set: { role: 'admin' } }
    );

    console.log('Update result:', result);

    // Verify the change
    const updatedUser = await User.findOne({ username: 'admin2' });
    console.log(`Verified role: ${updatedUser.role}`);

    // Also check if there are any other users with admin role
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} users with admin role:`);
    adminUsers.forEach(user => {
      console.log(`- ${user.username} (${user._id}): ${user.role}`);
    });

    console.log('Admin role fix completed.');
  } catch (err) {
    console.error('Error during admin role fix:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
fixAdminRole();
