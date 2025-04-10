const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('../models/Exam');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function dropExamIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Drop the problematic index
    console.log('Dropping examId_1 index from Exam collection...');
    await Exam.collection.dropIndex('examId_1');
    console.log('Successfully dropped examId_1 index');

    // Verify indexes after dropping
    console.log('\nVerifying indexes on Exam collection...');
    const examIndexes = await Exam.collection.indexes();
    console.log('Exam indexes after dropping:', JSON.stringify(examIndexes, null, 2));

  } catch (error) {
    console.error('Error dropping index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
dropExamIndex();
