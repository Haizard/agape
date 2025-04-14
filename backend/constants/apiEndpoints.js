/**
 * API Endpoint Constants
 * 
 * This file contains all API endpoint paths used in the application.
 * Using constants helps maintain consistency and makes future changes easier.
 */

const API_VERSION = 'v2';

const ENDPOINTS = {
  // Result endpoints
  RESULTS: {
    BASE: `/api/${API_VERSION}/results`,
    STUDENT: (studentId, examId) => `/api/${API_VERSION}/results/student/${studentId}/${examId}`,
    CLASS: (classId, examId) => `/api/${API_VERSION}/results/class/${classId}/${examId}`,
    SUBJECT: (subjectId) => `/api/${API_VERSION}/results/subject/${subjectId}`,
    ENTER_MARKS: `/api/${API_VERSION}/results/enter-marks`,
    ENTER_BATCH_MARKS: `/api/${API_VERSION}/results/enter-batch-marks`,
    REPORT: {
      STUDENT: (studentId, examId) => `/api/${API_VERSION}/results/report/student/${studentId}/${examId}`,
      CLASS: (classId, examId) => `/api/${API_VERSION}/results/report/class/${classId}/${examId}`,
      SEND_SMS: (studentId, examId) => `/api/${API_VERSION}/results/report/send-sms/${studentId}/${examId}`
    }
  }
};

// Education level constants
const EDUCATION_LEVELS = {
  O_LEVEL: 'O_LEVEL',
  A_LEVEL: 'A_LEVEL'
};

// Report types
const REPORT_TYPES = {
  STUDENT: 'STUDENT',
  CLASS: 'CLASS',
  TABULAR: 'TABULAR'
};

module.exports = {
  API_VERSION,
  ENDPOINTS,
  EDUCATION_LEVELS,
  REPORT_TYPES
};
