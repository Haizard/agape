const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // New admin details
    const newAdmin = {
      username: 'admin2',
      email: 'admin2@stjohnvianney.edu.tz',
      password: 'Admin123!',
      role: 'admin'
    };

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: newAdmin.email },
        { username: newAdmin.username }
      ]
    });

    if (existingAdmin) {
      console.log(`Admin user already exists with username ${newAdmin.username} or email ${newAdmin.email}`);
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    console.log('Creating new admin user...');
    const hashedPassword = await bcrypt.hash(newAdmin.password, 10);

    const adminUser = new User({
      username: newAdmin.username,
      email: newAdmin.email,
      password: hashedPassword,
      role: newAdmin.role,
      status: 'active'
    });

    await adminUser.save();
    console.log('\nNew admin user created successfully!');
    console.log('==============================');
    console.log(`Username: ${newAdmin.username}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Password: ${newAdmin.password}`);
    console.log(`Role: ${newAdmin.role}`);
    console.log('==============================');
    console.log('You can now log in with these credentials.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createAdminUser();
