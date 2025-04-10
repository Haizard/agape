const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function checkStudentSchema() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get the Student schema
    console.log('Student Schema:');
    console.log(Student.schema.paths);

    // Find a student
    const student = await Student.findOne();
    console.log('\nSample Student:');
    console.log(student);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
checkStudentSchema();
