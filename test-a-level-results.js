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

// Test data
const testData = {
  student: {
    _id: '60d21b4667d0d8992e610c85',
    firstName: 'Test',
    lastName: 'Student',
    educationLevel: 'A_LEVEL'
  },
  class: {
    _id: '60d21b4667d0d8992e610c86',
    name: 'Form 5A',
    educationLevel: 'A_LEVEL'
  },
  exam: {
    _id: '60d21b4667d0d8992e610c87',
    name: 'Mid Term Exam',
    academicYear: '60d21b4667d0d8992e610c88'
  },
  subjects: [
    {
      _id: '60d21b4667d0d8992e610c89',
      name: 'Physics',
      code: 'PHY',
      isPrincipal: true
    },
    {
      _id: '60d21b4667d0d8992e610c8a',
      name: 'Chemistry',
      code: 'CHE',
      isPrincipal: true
    },
    {
      _id: '60d21b4667d0d8992e610c8b',
      name: 'Mathematics',
      code: 'MAT',
      isPrincipal: true
    },
    {
      _id: '60d21b4667d0d8992e610c8c',
      name: 'General Studies',
      code: 'GS',
      isPrincipal: false
    }
  ]
};

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

// Run tests
async function runTests() {
  logInfo('Starting A-Level results system tests...');

  await testPrincipalSubjectFlag();
  await testNullUndefinedDataHandling();
  await testEducationLevelMismatches();
  await testEnterMarksEndpoint();

  logInfo('Tests completed');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
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
