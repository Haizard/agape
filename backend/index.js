const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Add path module for file path operations

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
const aLevelComprehensiveReportRoutes = require('./routes/aLevelComprehensiveReportRoutes');
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
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const fixedSubjectRoutes = require('./routes/fixedSubjectRoutes');
const parentContactRoutes = require('./routes/parentContactRoutes');
const financeRoutes = require('./routes/financeRoutes');
const smsRoutes = require('./routes/smsRoutes');
const smsSettingsRoutes = require('./routes/smsSettingsRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const setupRoutes = require('./routes/setupRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const educationLevelRoutes = require('./routes/educationLevelRoutes');
const subjectCombinationRoutes = require('./routes/subjectCombinationRoutes');
const studentSubjectSelectionRoutes = require('./routes/studentSubjectSelectionRoutes');
const dataConsistencyRoutes = require('./routes/dataConsistencyRoutes');

const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://st-john-vianey-frontend.onrender.com',
  'https://agape-seminary-school-system.onrender.com',
  'https://agape-seminary-school.onrender.com',
  'https://agape-seminary-school-frontend.onrender.com',
  'https://agape-seminary-school-system.netlify.app',
  'https://agape-seminary-school-backend.koyeb.app',
  'https://misty-roby-haizard-17a53e2a.koyeb.app',
  'https://agape-school-system.onrender.com',
  'https://agape-render.onrender.com',
  // Add any additional origins here
];

// Configure CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) === -1) {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Allowing origin:', origin);
        return callback(null, true);
      }

      console.log('Blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    console.log('Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors());

// Health check endpoints
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Frontend health check endpoint
app.get('/health', (req, res) => {
  console.log('Frontend health check request received');
  res.status(200).json({ status: 'ok', message: 'Frontend server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/school-frontend-app/build')));

// Debug middleware to log all requests and fix API URL duplication
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);

  // Fix API URL duplication issue (e.g., /api/api/classes)
  if (req.path.startsWith('/api/api/')) {
    const correctedPath = req.path.replace('/api/api/', '/api/');
    console.log(`Correcting duplicated API path: ${req.path} -> ${correctedPath}`);
    req.url = req.url.replace('/api/api/', '/api/');
  }

  // Handle requests with undefined IDs
  if (req.path.includes('/undefined') || req.path.includes('/null')) {
    console.log(`Blocking request with undefined/null ID: ${req.path}`);
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID: undefined or null IDs are not allowed'
    });
  }

  // Log request headers for debugging
  console.log('Request headers:', req.headers);
  
  next();
});

// Special CORS middleware for critical routes
const criticalRoutesCors = cors({
  origin: '*', // Allow all origins for critical routes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  credentials: true
});

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
app.use('/api/a-level-comprehensive', aLevelComprehensiveReportRoutes);
app.use('/api/character-assessments', characterAssessmentRoutes);
app.use('/api/student-education-level', studentEducationLevelRoutes);

// Apply special CORS for critical routes
app.use('/api/exams', criticalRoutesCors, examRoutes);
app.use('/api/classes', criticalRoutesCors, classRoutes);

// Direct route handlers for critical endpoints with CORS issues
app.get('/api/exams-direct', criticalRoutesCors, async (req, res) => {
  try {
    console.log('Direct exams endpoint called');
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Forward to the exam routes
    req.url = '/api/exams';
    return examRoutes(req, res);
  } catch (error) {
    console.error('Error in direct exams endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/classes-direct', criticalRoutesCors, async (req, res) => {
  try {
    console.log('Direct classes endpoint called');
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Forward to the class routes
    req.url = '/api/classes';
    return classRoutes(req, res);
  } catch (error) {
    console.error('Error in direct classes endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.use('/api/news', newsRoutes);
app.use('/api/exam-types', examTypeRoutes);
app.use('/api/academic-years', academicRoutes);
app.use('/api/new-academic-years', newAcademicRoutes);
app.use('/api', directStudentRegister);
app.use('/api/debug', debugRoutes);
app.use('/api/direct-test', directTestRoutes);
app.use('/api/teacher-classes', teacherClassesRoute);
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

// Catch-all route handler for client-side routing
app.get('*', (req, res) => {
  // Serve the index.html file from the frontend build directory for any unmatched routes
  res.sendFile(path.join(__dirname, '../frontend/school-frontend-app/build', 'index.html'));
});

module.exports = app;
