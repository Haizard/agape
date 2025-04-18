/**
 * Test script for A-Level results system
 *
 * This script tests the A-Level results system to ensure it properly handles:
 * - Principal subject flag
 * - Null/undefined data
 * - Education level mismatches
 * - Enter marks endpoint
 */

const axios = require('axios');
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const ALevelResult = require('./models/ALevelResult');
const Class = require('./models/Class');
const Exam = require('./models/Exam');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TOKEN = process.env.TOKEN || 'your-auth-token';

// Generate valid MongoDB ObjectIds
function generateObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

// Test data with valid MongoDB ObjectIds
const testData = {
  student: {
    _id: generateObjectId(),
    firstName: 'Test',
    lastName: 'Student',
    educationLevel: 'A_LEVEL'
  },
  class: {
    _id: generateObjectId(),
    name: 'Form 5A',
    educationLevel: 'A_LEVEL'
  },
  exam: {
    _id: generateObjectId(),
    name: 'Mid Term Exam',
    academicYear: generateObjectId()
  },
  subjects: [
    {
      _id: generateObjectId(),
      name: 'Physics',
      code: 'PHY',
      isPrincipal: true
    },
    {
      _id: generateObjectId(),
      name: 'Chemistry',
      code: 'CHE',
      isPrincipal: true
    },
    {
      _id: generateObjectId(),
      name: 'Mathematics',
      code: 'MAT',
      isPrincipal: true
    },
    {
      _id: generateObjectId(),
      name: 'General Studies',
      code: 'GS',
      isPrincipal: false
    }
  ]
};

// Log the test data for reference
console.log('Test data:', JSON.stringify(testData, null, 2));

// Helper functions
const logSuccess = (message) => console.log(`✅ ${message}`);
const logError = (message) => console.error(`❌ ${message}`);
const logInfo = (message) => console.log(`ℹ️ ${message}`);

// Test functions
async function testPrincipalSubjectFlag() {
  logInfo('Testing principal subject flag handling...');

  try {
    // Test entering marks with isPrincipal flag
    const response = await axios.post(`${API_URL}/a-level-results/enter-marks`, {
      studentId: testData.student._id,
      examId: testData.exam._id,
      academicYearId: testData.exam.academicYear,
      examTypeId: testData.exam._id,
      subjectId: testData.subjects[0]._id,
      classId: testData.class._id,
      marksObtained: 85,
      isPrincipal: true
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (response.data && response.data.isPrincipal === true) {
      logSuccess('Principal subject flag is properly saved');
    } else {
      logError('Principal subject flag is not properly saved');
    }

    // Test entering marks without isPrincipal flag (should use subject's flag)
    const response2 = await axios.post(`${API_URL}/a-level-results/enter-marks`, {
      studentId: testData.student._id,
      examId: testData.exam._id,
      academicYearId: testData.exam.academicYear,
      examTypeId: testData.exam._id,
      subjectId: testData.subjects[1]._id,
      classId: testData.class._id,
      marksObtained: 75
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (response2.data && response2.data.isPrincipal === true) {
      logSuccess('Subject\'s isPrincipal flag is properly used as fallback');
    } else {
      logError('Subject\'s isPrincipal flag is not properly used as fallback');
    }
  } catch (error) {
    logError(`Error testing principal subject flag: ${error.message}`);
  }
}

async function testNullUndefinedDataHandling() {
  logInfo('Testing null/undefined data handling...');

  try {
    // Test getting class report with missing data
    const response = await axios.get(`${API_URL}/a-level-results/class/${testData.class._id}/${testData.exam._id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (response.data && response.data.students) {
      // Check if students array is properly normalized
      const student = response.data.students[0];
      if (student.name && student.rollNumber && Array.isArray(student.results)) {
        logSuccess('Class report properly normalizes missing data');
      } else {
        logError('Class report does not properly normalize missing data');
      }
    } else {
      logError('Failed to get class report');
    }
  } catch (error) {
    logError(`Error testing null/undefined data handling: ${error.message}`);
  }
}

async function testEducationLevelMismatches() {
  logInfo('Testing education level mismatches...');

  try {
    // Test with wrong education level
    const wrongStudent = { ...testData.student, educationLevel: 'O_LEVEL' };

    try {
      await axios.post(`${API_URL}/a-level-results/enter-marks`, {
        studentId: wrongStudent._id,
        examId: testData.exam._id,
        academicYearId: testData.exam.academicYear,
        examTypeId: testData.exam._id,
        subjectId: testData.subjects[0]._id,
        classId: testData.class._id,
        marksObtained: 85
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      logError('Education level mismatch not detected');
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message) {
        logSuccess('Education level mismatch properly detected and reported');
      } else {
        logError(`Unexpected error: ${error.message}`);
      }
    }
  } catch (error) {
    logError(`Error testing education level mismatches: ${error.message}`);
  }
}

async function testEnterMarksEndpoint() {
  logInfo('Testing enter marks endpoint...');

  try {
    // Test entering marks with all required fields
    const response = await axios.post(`${API_URL}/a-level-results/enter-marks`, {
      studentId: testData.student._id,
      examId: testData.exam._id,
      academicYearId: testData.exam.academicYear,
      examTypeId: testData.exam._id,
      subjectId: testData.subjects[2]._id,
      classId: testData.class._id,
      marksObtained: 90,
      comment: 'Excellent work',
      isPrincipal: true
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (response.data && response.data.marksObtained === 90 && response.data.isPrincipal === true) {
      logSuccess('Enter marks endpoint properly saves all fields');
    } else {
      logError('Enter marks endpoint does not properly save all fields');
    }

    // Test batch marks entry
    const batchResponse = await axios.post(`${API_URL}/a-level-results/batch`, [
      {
        studentId: testData.student._id,
        examId: testData.exam._id,
        academicYearId: testData.exam.academicYear,
        examTypeId: testData.exam._id,
        subjectId: testData.subjects[3]._id,
        classId: testData.class._id,
        marksObtained: 80,
        isPrincipal: false
      }
    ], {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (batchResponse.data && batchResponse.data.success) {
      logSuccess('Batch marks entry works properly');
    } else {
      logError('Batch marks entry does not work properly');
    }
  } catch (error) {
    logError(`Error testing enter marks endpoint: ${error.message}`);
  }
}

// Setup test data in the database
async function setupTestData() {
  logInfo('Setting up test data in the database...');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logInfo('Connected to MongoDB');

    // Create student
    const student = new Student({
      _id: testData.student._id,
      firstName: testData.student.firstName,
      lastName: testData.student.lastName,
      educationLevel: testData.student.educationLevel,
      rollNumber: 'TEST001',
      gender: 'Male',
      dateOfBirth: new Date('2000-01-01')
    });
    await student.save();
    logSuccess('Created test student');

    // Create class
    const classObj = new Class({
      _id: testData.class._id,
      name: testData.class.name,
      educationLevel: testData.class.educationLevel,
      academicYear: testData.exam.academicYear
    });
    await classObj.save();
    logSuccess('Created test class');

    // Create exam
    const exam = new Exam({
      _id: testData.exam._id,
      name: testData.exam.name,
      academicYear: testData.exam.academicYear,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await exam.save();
    logSuccess('Created test exam');

    // Create subjects
    for (const subjectData of testData.subjects) {
      const subject = new Subject({
        _id: subjectData._id,
        name: subjectData.name,
        code: subjectData.code,
        isPrincipal: subjectData.isPrincipal
      });
      await subject.save();
    }
    logSuccess('Created test subjects');

    return true;
  } catch (error) {
    logError(`Error setting up test data: ${error.message}`);
    return false;
  }
}

// Clean up test data from the database
async function cleanupTestData() {
  logInfo('Cleaning up test data from the database...');

  try {
    // Delete student
    await Student.deleteOne({ _id: testData.student._id });

    // Delete class
    await Class.deleteOne({ _id: testData.class._id });

    // Delete exam
    await Exam.deleteOne({ _id: testData.exam._id });

    // Delete subjects
    for (const subject of testData.subjects) {
      await Subject.deleteOne({ _id: subject._id });
    }

    // Delete results
    await ALevelResult.deleteMany({ studentId: testData.student._id });

    logSuccess('Cleaned up test data');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    logInfo('Disconnected from MongoDB');

    return true;
  } catch (error) {
    logError(`Error cleaning up test data: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  logInfo('Starting A-Level results system tests...');

  // Setup test data
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    logError('Failed to set up test data, aborting tests');
    return;
  }

  try {
    await testPrincipalSubjectFlag();
    await testNullUndefinedDataHandling();
    await testEducationLevelMismatches();
    await testEnterMarksEndpoint();

    logInfo('Tests completed');
  } catch (error) {
    logError(`Test error: ${error.message}`);
  } finally {
    // Clean up test data
    await cleanupTestData();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  // First check if we can connect to the API
  axios.get(`${API_URL}/health`)
    .then(() => {
      logInfo('API is reachable, running tests...');
      return runTests();
    })
    .catch(error => {
      logError(`Cannot connect to API: ${error.message}`);
      logInfo('Make sure the server is running on http://localhost:5000');
      process.exit(1);
    })
    .catch(error => {
      logError(`Test suite error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testPrincipalSubjectFlag,
  testNullUndefinedDataHandling,
  testEducationLevelMismatches,
  testEnterMarksEndpoint
};
