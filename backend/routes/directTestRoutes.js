/**
 * Direct Test Routes
 * 
 * These routes are for direct testing purposes only and should be disabled in production.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Direct test for marks entry
router.post('/marks-entry', async (req, res) => {
  try {
    console.log('Direct test for marks entry');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { marksData } = req.body;
    
    if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ message: 'Invalid marks data. Expected an array of marks.' });
    }
    
    // Log each mark for debugging
    marksData.forEach((mark, index) => {
      console.log(`Mark ${index + 1}:`, JSON.stringify(mark, null, 2));
      
      // Check for required fields
      const requiredFields = ['studentId', 'subjectId', 'classId', 'academicYearId', 'marksObtained'];
      const missingFields = requiredFields.filter(field => !mark[field]);
      
      if (missingFields.length > 0) {
        console.log(`Mark ${index + 1} is missing required fields:`, missingFields);
      }
      
      // Check if classId is a valid ObjectId
      if (mark.classId) {
        try {
          const isValidObjectId = mongoose.Types.ObjectId.isValid(mark.classId);
          console.log(`Mark ${index + 1} classId is valid ObjectId:`, isValidObjectId);
        } catch (err) {
          console.log(`Mark ${index + 1} classId is not a valid ObjectId:`, mark.classId);
        }
      }
    });
    
    // Create a direct result object without saving to the database
    const resultData = {
      studentId: marksData[0].studentId,
      subjectId: marksData[0].subjectId,
      classId: marksData[0].classId,
      academicYearId: marksData[0].academicYearId,
      marksObtained: marksData[0].marksObtained
    };
    
    // Add optional fields if they exist
    if (marksData[0].examId) resultData.examId = marksData[0].examId;
    if (marksData[0].examTypeId) resultData.examTypeId = marksData[0].examTypeId;
    if (marksData[0].examName) resultData.examName = marksData[0].examName;
    
    console.log('Result data:', JSON.stringify(resultData, null, 2));
    
    // Create a mongoose schema for validation
    const ResultSchema = new mongoose.Schema({
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
      academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
      examTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType' },
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
      classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
      marksObtained: { type: Number, required: true },
      examName: { type: String }
    });
    
    // Create a model for validation
    const TestResult = mongoose.model('TestResult', ResultSchema);
    
    // Create a test result for validation
    const testResult = new TestResult(resultData);
    
    // Validate the test result
    try {
      await testResult.validate();
      console.log('Test result validation passed');
      
      res.json({
        message: 'Direct test successful',
        testResult: testResult.toObject(),
        marksData
      });
    } catch (validationError) {
      console.error('Test result validation failed:', validationError);
      
      res.status(400).json({
        message: 'Result validation failed',
        errors: validationError.errors,
        resultData
      });
    }
  } catch (error) {
    console.error('Error in direct test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
