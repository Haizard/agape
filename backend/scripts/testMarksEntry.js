/**
 * Script to test marks entry directly
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Result = require('../models/Result');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  testMarksEntry();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function testMarksEntry() {
  try {
    console.log('Testing marks entry...');
    
    // Test data
    const testData = {
      studentId: '67f31bc08294e2a31a73bc09',
      subjectId: '67f2fe0fdcc60fd7fef2ef36',
      classId: '67f2fe0fdcc60fd7fef2ef36', // Using a known valid class ID
      academicYearId: '67f300efdcc60fd7fef2ef72',
      examId: '67f31fdcb9315b9d40ed06a7',
      marksObtained: 85,
      grade: 'A'
    };
    
    console.log('Test data:', testData);
    
    // Create a new result
    const newResult = new Result(testData);
    
    // Validate the result
    try {
      await newResult.validate();
      console.log('Validation passed!');
      
      // Save the result
      await newResult.save();
      console.log('Result saved successfully!');
      console.log('Saved result:', newResult);
    } catch (validationError) {
      console.error('Validation failed:', validationError);
      
      // Check if classId is the issue
      if (validationError.errors && validationError.errors.classId) {
        console.error('ClassId validation error:', validationError.errors.classId);
        
        // Try to fix the classId
        console.log('Trying to fix classId...');
        newResult.classId = mongoose.Types.ObjectId('67f2fe0fdcc60fd7fef2ef36');
        
        try {
          await newResult.validate();
          console.log('Validation passed after fixing classId!');
          
          // Save the result
          await newResult.save();
          console.log('Result saved successfully after fixing classId!');
          console.log('Saved result:', newResult);
        } catch (fixedValidationError) {
          console.error('Validation still failed after fixing classId:', fixedValidationError);
        }
      }
    }
  } catch (error) {
    console.error('Error testing marks entry:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}
