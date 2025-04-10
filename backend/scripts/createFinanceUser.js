/**
 * Script to create a finance user
 *
 * Run this script with Node.js:
 * node scripts/createFinanceUser.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Finance = require('../models/Finance');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

// Finance user data
const financeUserData = {
  // User account data
  username: 'finance_admin',
  email: 'finance@school.com',
  password: 'Finance@123', // This will be hashed

  // Finance profile data
  firstName: 'Finance',
  lastName: 'Manager',
  contactNumber: '1234567890',
  position: 'finance_manager', // Options: 'accountant', 'finance_manager', 'bursar', 'cashier'
  employeeId: 'FIN-001'
};

// Create finance user
async function createFinanceUser() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: financeUserData.username },
        { email: financeUserData.email }
      ]
    });

    if (existingUser) {
      console.error('User with this username or email already exists');
      process.exit(1);
    }

    // Check if finance profile already exists
    const existingFinance = await Finance.findOne({
      $or: [
        { email: financeUserData.email },
        { employeeId: financeUserData.employeeId }
      ]
    });

    if (existingFinance) {
      console.error('Finance profile with this email or employee ID already exists');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(financeUserData.password, salt);

    // Create user account
    const user = new User({
      username: financeUserData.username,
      email: financeUserData.email,
      password: hashedPassword,
      role: 'finance'
    });

    const savedUser = await user.save({ session });
    console.log(`Created user: ${savedUser._id} with role: finance`);

    // Create finance profile
    const finance = new Finance({
      userId: savedUser._id,
      firstName: financeUserData.firstName,
      lastName: financeUserData.lastName,
      email: financeUserData.email,
      contactNumber: financeUserData.contactNumber,
      position: financeUserData.position,
      employeeId: financeUserData.employeeId,
      status: 'active'
    });

    const savedFinance = await finance.save({ session });
    console.log(`Created finance profile: ${savedFinance._id} for user: ${savedUser._id}`);

    await session.commitTransaction();
    console.log('Finance user created successfully');
    console.log('Login credentials:');
    console.log(`Username: ${financeUserData.username}`);
    console.log(`Password: ${financeUserData.password}`);
    console.log(`Role: finance`);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating finance user:', error);
  } finally {
    session.endSession();
    mongoose.disconnect();
  }
}

// Run the function
createFinanceUser();
