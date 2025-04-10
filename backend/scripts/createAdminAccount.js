const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

// Admin account details - you can modify these as needed
const adminDetails = {
  username: 'admin2',
  email: 'admin2@stjohnvianney.edu.tz',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  employeeId: 'ADM002',
  phone: '255712345678',
  gender: 'Male',
  role: 'admin'
};

async function createAdminAccount() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: adminDetails.username },
        { email: adminDetails.email }
      ]
    });

    if (existingUser) {
      console.log(`User with username ${adminDetails.username} or email ${adminDetails.email} already exists`);
      await mongoose.disconnect();
      return;
    }

    // Check if admin profile already exists
    const existingAdmin = await Admin.findOne({ employeeId: adminDetails.employeeId });
    if (existingAdmin) {
      console.log(`Admin with employee ID ${adminDetails.employeeId} already exists`);
      await mongoose.disconnect();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminDetails.password, salt);

    // Create the user account
    const newUser = new User({
      username: adminDetails.username,
      email: adminDetails.email,
      password: hashedPassword,
      role: adminDetails.role
    });

    const savedUser = await newUser.save();
    console.log(`Created user account: ${savedUser._id} (${savedUser.username})`);

    // Create the admin profile
    const newAdmin = new Admin({
      firstName: adminDetails.firstName,
      lastName: adminDetails.lastName,
      email: adminDetails.email,
      employeeId: adminDetails.employeeId,
      phone: adminDetails.phone,
      gender: adminDetails.gender,
      userId: savedUser._id,
      status: 'active'
    });

    const savedAdmin = await newAdmin.save();
    console.log(`Created admin profile: ${savedAdmin._id} (${savedAdmin.firstName} ${savedAdmin.lastName})`);

    console.log('\nAdmin Account Created Successfully!');
    console.log('==============================');
    console.log(`Username: ${adminDetails.username}`);
    console.log(`Password: ${adminDetails.password}`);
    console.log(`Email: ${adminDetails.email}`);
    console.log(`Role: ${adminDetails.role}`);
    console.log('==============================');
    console.log('You can now log in with these credentials.');

  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAdminAccount();
