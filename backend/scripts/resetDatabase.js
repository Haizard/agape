/**
 * Database Reset Script
 *
 * This script removes all data from the database except for the admin user with username "admin2".
 * Use with caution as this operation cannot be undone.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ParentContact = require('../models/ParentContact');
const Setting = require('../models/Setting');
const AcademicYear = require('../models/AcademicYear');
const ExamType = require('../models/ExamType');
const News = require('../models/News');
const StudentAssignment = require('../models/StudentAssignment');
const TeacherAssignment = require('../models/TeacherAssignment');
const fs = require('fs');
const path = require('path');

// Get all model files from the models directory
const modelsDir = path.join(__dirname, '../models');
const modelFiles = fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .map(file => file.replace('.js', ''));

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

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    // Wait for connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the admin2 user to preserve
    const adminUser = await User.findOne({ username: 'admin2' });

    if (!adminUser) {
      console.error('Admin user "admin2" not found. Aborting reset.');
      process.exit(1);
    }

    console.log(`Found admin user: ${adminUser.username} (${adminUser._id})`);

    // Since there's no Admin model, we'll just preserve the user account
    console.log('Will preserve the user account for admin2.');

    // Get all model names from the models directory
    console.log('Models to reset:', modelFiles.join(', '));

    // Process each model
    for (const modelName of modelFiles) {
      try {
        // Skip if the model doesn't exist
        if (!mongoose.models[modelName]) {
          console.log(`Skipping ${modelName} - model not registered`);
          continue;
        }

        const Model = mongoose.model(modelName);
        console.log(`Processing ${modelName}...`);

        if (modelName === 'User') {
          // For User model, delete all except admin2
          const result = await Model.deleteMany({ _id: { $ne: adminUser._id } });
          console.log(`Deleted ${result.deletedCount} documents from ${modelName} (preserved admin2)`);
        } else {
          // For all other models, delete everything
          const count = await Model.countDocuments();
          const result = await Model.deleteMany({});
          console.log(`Deleted ${result.deletedCount}/${count} documents from ${modelName}`);
        }
      } catch (err) {
        console.error(`Error processing ${modelName}:`, err);
      }
    }

    console.log('Database reset complete. Only admin2 user has been preserved.');
  } catch (err) {
    console.error('Error during database reset:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Ask for confirmation before proceeding
console.log('\x1b[31m%s\x1b[0m', 'WARNING: This will delete ALL data except the admin2 user account.');
console.log('\x1b[31m%s\x1b[0m', 'This operation CANNOT be undone.');
console.log('');
console.log('To proceed, type "RESET" and press Enter:');

process.stdin.once('data', (data) => {
  const input = data.toString().trim();
  if (input === 'RESET') {
    resetDatabase();
  } else {
    console.log('Reset cancelled.');
    process.exit(0);
  }
});
