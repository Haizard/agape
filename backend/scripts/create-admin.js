const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/john_vianey';

console.log('Using MongoDB URI:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import User model
const User = require('../models/User');

// Admin user data
const adminData = {
  username: 'superadmin',
  email: 'superadmin@school.com',
  password: 'SuperAdmin@123',
  role: 'admin'
};

// Function to create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      // Update existing admin
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();

      console.log('Admin password updated successfully');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('New Password:', adminData.password);
      console.log('Role:', existingAdmin.role);

      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create new admin user
    const adminUser = new User({
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      role: adminData.role
    });

    // Save admin user
    await adminUser.save();

    console.log('Admin user created successfully');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role:', adminData.role);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
console.log('Starting admin user creation...');
createAdminUser().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
