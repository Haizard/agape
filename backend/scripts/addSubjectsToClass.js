/**
 * Script to add A-Level subjects to a class
 * 
 * This script adds all A-Level subjects to a specified class
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// Class ID to update
const CLASS_ID = '67fa6d5df511ccf0cff1f86c';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find the class
    const classItem = await Class.findById(CLASS_ID);
    if (!classItem) {
      console.error(`Class not found with ID: ${CLASS_ID}`);
      process.exit(1);
    }
    
    console.log(`Found class: ${classItem.name}`);
    
    // Find all A-Level subjects
    const subjects = await Subject.find({
      educationLevel: { $in: ['A_LEVEL', 'BOTH'] }
    });
    
    console.log(`Found ${subjects.length} A-Level subjects`);
    
    // Check if class already has subjects
    if (classItem.subjects && classItem.subjects.length > 0) {
      console.log(`Class already has ${classItem.subjects.length} subjects`);
      
      // Get existing subject IDs
      const existingSubjectIds = classItem.subjects.map(s => 
        s.subject ? s.subject.toString() : s.toString()
      );
      
      // Add only new subjects
      const newSubjects = subjects.filter(s => !existingSubjectIds.includes(s._id.toString()));
      
      if (newSubjects.length === 0) {
        console.log('No new subjects to add');
        process.exit(0);
      }
      
      console.log(`Adding ${newSubjects.length} new subjects to class`);
      
      // Add new subjects to class
      for (const subject of newSubjects) {
        classItem.subjects.push({
          subject: subject._id
        });
      }
    } else {
      console.log('Class has no subjects, adding all A-Level subjects');
      
      // Add all subjects to class
      classItem.subjects = subjects.map(subject => ({
        subject: subject._id
      }));
    }
    
    // Save the class
    await classItem.save();
    
    console.log(`Successfully added subjects to class ${classItem.name}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});
