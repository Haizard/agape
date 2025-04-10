const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('../models/Exam');
const Result = require('../models/Result');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function checkIndexes() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check indexes on Exam collection
    console.log('\nChecking indexes on Exam collection...');
    const examIndexes = await Exam.collection.indexes();
    console.log('Exam indexes:', JSON.stringify(examIndexes, null, 2));

    // Check indexes on Result collection
    console.log('\nChecking indexes on Result collection...');
    const resultIndexes = await Result.collection.indexes();
    console.log('Result indexes:', JSON.stringify(resultIndexes, null, 2));

  } catch (error) {
    console.error('Error checking indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
checkIndexes();
