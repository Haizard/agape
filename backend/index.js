const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- Add Model Imports Here ---
require('./models/User');
require('./models/Teacher');
require('./models/Student');
require('./models/AcademicYear');
require('./models/Class');
require('./models/Subject'); // Ensure Subject is loaded
require('./models/Exam');
require('./models/ExamType');
require('./models/Result');
require('./models/News');
require('./models/ParentContact'); // Parent contact model for SMS
// Education level models
require('./models/EducationLevel');
require('./models/SubjectCombination');
// Finance models
require('./models/Finance');
require('./models/FeeStructure');
require('./models/FeeSchedule');
require('./models/StudentFee');
require('./models/Payment');
require('./models/QuickbooksConfig');
require('./models/StudentSubjectSelection'); // Add StudentSubjectSelection model
require('./models/CharacterAssessment'); // Add CharacterAssessment model
// -----------------------------

const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const resultRoutes = require('./routes/resultRoutes');
const fixedResultRoutes = require('./routes/fixedResultRoutes');
const directTestRoutes = require('./routes/directTestRoutes');
const resultReportRoutes = require('./routes/resultReportRoutes');
const aLevelResultRoutes = require('./routes/aLevelResultRoutes');
const oLevelResultRoutes = require('./routes/oLevelResultRoutes');
const characterAssessmentRoutes = require('./routes/characterAssessmentRoutes');
const studentEducationLevelRoutes = require('./routes/studentEducationLevelRoutes');
const examRoutes = require('./routes/examRoutes');
const newsRoutes = require('./routes/newsRoutes');
const examTypeRoutes = require('./routes/examTypeRoutes');
const academicRoutes = require('./routes/academicRoutes');
const newAcademicRoutes = require('./routes/newAcademicRoutes');
const directStudentRegister = require('./routes/directStudentRegister');
const debugRoutes = require('./routes/debugRoutes');
const teacherClassesRoute = require('./routes/teacherClassesRoute');
const financeRoutes = require('./routes/financeRoutes');
// const classRoutes = require('./routes/classRoutes');
const classRoutes = require('./routes/fixedClassRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const fixedSubjectRoutes = require('./routes/fixedSubjectRoutes');
const parentContactRoutes = require('./routes/parentContactRoutes');
const smsRoutes = require('./routes/smsRoutes');
const smsSettingsRoutes = require('./routes/smsSettingsRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const setupRoutes = require('./routes/setupRoutes');
const educationLevelRoutes = require('./routes/educationLevelRoutes');
const subjectCombinationRoutes = require('./routes/subjectCombinationRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const studentSubjectSelectionRoutes = require('./routes/studentSubjectSelectionRoutes');
const dataConsistencyRoutes = require('./routes/dataConsistencyRoutes');

const app = express();

// Middleware
// Configure CORS with specific options
const allowedOrigins = [
  'http://localhost:3000',
  'https://st-john-vianey-frontend.onrender.com',
  'https://agape-seminary-school-system.onrender.com',
  'https://agape-seminary-school.onrender.com',
  'https://agape-seminary-school-frontend.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) === -1) {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 86400, // Cache preflight requests for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

console.log(`CORS configured for environment: ${process.env.NODE_ENV || 'development'}`);

// Handle preflight requests
app.options('*', cors());

// Health check endpoints
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Authentication test endpoint
app.get('/api/auth-test', (req, res) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log('Auth test request received with header:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ status: 'error', message: 'No authorization header found' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token found in authorization header' });
  }

  // We're not actually verifying the token here, just checking if it exists
  res.status(200).json({ status: 'ok', message: 'Authorization header found', token_present: true });
});

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mock data middleware for development
if (process.env.USE_MOCK_DATA === 'true') {
  console.log('Using mock data middleware');
  const mockDataMiddleware = require('./middleware/mockDataMiddleware');
  app.use(mockDataMiddleware);
}

// Register routes
app.use('/api/users', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
// Use fixed result routes for batch marks entry
app.use('/api/results/enter-marks/batch', fixedResultRoutes);
// Use original result routes for other endpoints
app.use('/api/results', resultRoutes);
app.use('/api/results/report', resultReportRoutes);
app.use('/api/a-level-results', aLevelResultRoutes);
app.use('/api/o-level-results', oLevelResultRoutes);
app.use('/api/character-assessments', characterAssessmentRoutes);
app.use('/api/student-education-level', studentEducationLevelRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/exam-types', examTypeRoutes);
app.use('/api/academic-years', academicRoutes);
app.use('/api/new-academic-years', newAcademicRoutes);
app.use('/api', directStudentRegister);
app.use('/api/debug', debugRoutes);
app.use('/api/direct-test', directTestRoutes);
app.use('/api/teacher-classes', teacherClassesRoute);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/fixed-subjects', fixedSubjectRoutes);
app.use('/api/parent-contacts', parentContactRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/settings/sms', smsSettingsRoutes);
app.use('/api/student-assignments', assignmentRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/education-levels', educationLevelRoutes);
app.use('/api/subject-combinations', subjectCombinationRoutes);
app.use('/api/student-subject-selections', studentSubjectSelectionRoutes);
app.use('/api/data-consistency', dataConsistencyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Something broke!',
    error: err.message
  });
});

// Handle 404 routes - Make sure this is last
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` });
});

module.exports = app;
