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
// const aLevelResultRoutes = require('./routes/aLevelResultRoutes');
const oLevelResultRoutes = require('./routes/oLevelResultRoutes');
const aLevelResultBatchRoutes = require('./routes/aLevelResultBatchRoutes');
const legacyALevelResultBatchRoutes = require('./routes/legacyALevelResultBatchRoutes');
const legacyRedirectRoutes = require('./routes/legacyRedirectRoutes');
const oLevelResultBatchRoutes = require('./routes/oLevelResultBatchRoutes');
const aLevelComprehensiveReportRoutes = require('./routes/aLevelComprehensiveReportRoutes');
const unifiedComprehensiveReportRoutes = require('./routes/unifiedComprehensiveReportRoutes');
const aLevelReportRoutes = require('./routes/aLevelReportRoutes');
const characterAssessmentRoutes = require('./routes/characterAssessmentRoutes');
const studentEducationLevelRoutes = require('./routes/studentEducationLevelRoutes');
const checkMarksRoutes = require('./routes/checkMarksRoutes');
const newALevelResultRoutes = require('./routes/newALevelResultRoutes');
// Import v2 routes
const v2ResultRoutes = require('./routes/v2/resultRoutes');
// Import standardized O-Level routes
const standardizedOLevelRoutes = require('./routes/standardizedOLevelRoutes');

// Import logger
const logger = require('./utils/logger');
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
const aLevelSubjectRoutes = require('./routes/aLevelSubjectRoutes');
const parentContactRoutes = require('./routes/parentContactRoutes');
const financeRoutes = require('./routes/financeRoutes');
const quickbooksRoutes = require('./routes/quickbooksRoutes');
const smsRoutes = require('./routes/smsRoutes');
const smsSettingsRoutes = require('./routes/smsSettingsRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const setupRoutes = require('./routes/setupRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const educationLevelRoutes = require('./routes/educationLevelRoutes');
const subjectCombinationRoutes = require('./routes/subjectCombinationRoutes');
const studentSubjectSelectionRoutes = require('./routes/studentSubjectSelectionRoutes');
const dataConsistencyRoutes = require('./routes/dataConsistencyRoutes');
const publicReportRoutes = require('./routes/publicReportRoutes');
const fixTeacherRoute = require('./routes/fixTeacherRoute');
const enhancedTeacherRoutes = require('./routes/enhancedTeacherRoutes');
const teacherSubjectAssignmentRoutes = require('./routes/teacherSubjectAssignmentRoutes');
const studentImportRoutes = require('./routes/studentImportRoutes');

const app = express();

const { standardCors, openCors, allowedOrigins } = require('./middleware/cors');

// Apply CORS middleware
app.use(standardCors);

// Handle preflight requests
app.options('*', standardCors);

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

// Parse URL-encoded request bodies (for form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app build directory
const frontendBuildPath = path.join(__dirname, '../frontend/school-frontend-app/build');

// Serve static files from the public directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Check if the frontend build directory exists before serving static files
const fs = require('fs');
if (fs.existsSync(frontendBuildPath)) {
  console.log('Frontend build directory found, serving static files');
  app.use(express.static(frontendBuildPath));
} else {
  console.log('Frontend build directory not found at:', frontendBuildPath);
  console.log('Static file serving disabled');
}

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
// Use enhanced teacher routes for better functionality
app.use('/api/teachers', enhancedTeacherRoutes);

// Register the student import route separately to avoid conflicts
// Use openCors to allow file uploads from any origin
// Important: This must be registered BEFORE the general student routes
app.use('/api/students/import', openCors, studentImportRoutes);

// Register general student routes AFTER the import routes
app.use('/api/students', studentRoutes);

// Add a direct test endpoint for the import feature
app.get('/api/test-import', openCors, (req, res) => {
  console.log('Direct test endpoint accessed');
  return res.status(200).json({
    message: 'Direct test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// Register the file upload test route
app.use('/api/upload-test', openCors, require('./routes/fileUploadTestRoute'));

// Register standardized O-Level routes (primary implementation)
app.use('/api/o-level', standardizedOLevelRoutes);
console.log('Standardized O-Level routes registered at /api/o-level');

// Add deprecation notices for legacy routes

// Deprecated: Use /api/o-level/marks/batch instead
app.use('/api/o-level-results/batch', (req, res, next) => {
  console.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level/marks/batch instead`);
  logger.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level/marks/batch instead`);
  res.setHeader('X-Deprecated', 'This route is deprecated. Use /api/o-level/marks/batch instead.');
  next();
}, criticalRoutesCors, oLevelResultBatchRoutes);

// Deprecated: Use /api/o-level instead
app.use('/api/o-level-results', (req, res, next) => {
  console.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level instead`);
  logger.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level instead`);
  res.setHeader('X-Deprecated', 'This route is deprecated. Use /api/o-level instead.');
  next();
}, oLevelResultRoutes);

// Deprecated: Use /api/o-level/marks/batch instead
app.use('/api/results/enter-marks/batch', (req, res, next) => {
  console.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level/marks/batch instead`);
  logger.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level/marks/batch instead`);
  res.setHeader('X-Deprecated', 'This route is deprecated. Use /api/o-level/marks/batch instead.');
  next();
}, fixedResultRoutes);

// Deprecated: Use /api/v2/results or /api/o-level instead
app.use('/api/results', (req, res, next) => {
  console.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/v2/results or /api/o-level instead`);
  logger.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/v2/results or /api/o-level instead`);
  res.setHeader('X-Deprecated', 'This route is deprecated. Use /api/v2/results or /api/o-level instead.');
  next();
}, resultRoutes);

// Deprecated: Use /api/o-level/reports instead
app.use('/api/results/report', (req, res, next) => {
  console.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level/reports instead`);
  logger.warn(`DEPRECATED ROUTE: ${req.method} ${req.originalUrl} - Use /api/o-level/reports instead`);
  res.setHeader('X-Deprecated', 'This route is deprecated. Use /api/o-level/reports instead.');
  next();
}, resultReportRoutes);

// Other routes
app.use('/api/results/comprehensive', unifiedComprehensiveReportRoutes);
app.use('/api/a-level-results/batch', criticalRoutesCors, aLevelResultBatchRoutes);
// Legacy A-Level batch route
app.use('/api/legacy-a-level-results/batch', criticalRoutesCors, legacyALevelResultBatchRoutes);
app.use('/api/a-level-comprehensive', aLevelComprehensiveReportRoutes);
app.use('/api/a-level-reports', criticalRoutesCors, aLevelReportRoutes);
app.use('/api/character-assessments', characterAssessmentRoutes);
app.use('/api/student-education-level', studentEducationLevelRoutes);
app.use('/api/check-marks', checkMarksRoutes);

// New A-Level routes
app.use('/api/new-a-level', criticalRoutesCors, newALevelResultRoutes);
console.log('New A-Level routes registered at /api/new-a-level');

// Register v2 routes
app.use('/api/v2/results', v2ResultRoutes);

// Register assessment routes
const assessmentRoutes = require('./routes/assessmentRoutes');
app.use('/api/assessments', assessmentRoutes);
console.log('Assessment routes registered at /api/assessments');

// Apply special CORS for critical routes
app.use('/api/exams', criticalRoutesCors, examRoutes);
app.use('/api/classes', criticalRoutesCors, classRoutes);

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
app.use('/api/a-level-subjects', aLevelSubjectRoutes);
app.use('/api/parent-contacts', parentContactRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/finance/quickbooks', quickbooksRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/settings/sms', smsSettingsRoutes);
app.use('/api/student-assignments', assignmentRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/education-levels', educationLevelRoutes);
app.use('/api/subject-combinations', subjectCombinationRoutes);
app.use('/api/student-subject-selections', studentSubjectSelectionRoutes);
app.use('/api/data-consistency', dataConsistencyRoutes);
// Fix teacher routes
app.use('/api/fix-teacher', fixTeacherRoute);
// Enhanced teacher routes with improved O-Level handling
app.use('/api/enhanced-teachers', enhancedTeacherRoutes);
// Teacher-subject assignment routes
app.use('/api/teacher-subject-assignments', teacherSubjectAssignmentRoutes);
// Public routes with no authentication required
app.use('/api/public', criticalRoutesCors, publicReportRoutes);
// Legacy redirect routes
app.use('/api/legacy', legacyRedirectRoutes);

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
  // Check if the frontend build directory exists
  const indexPath = path.join(__dirname, '../frontend/school-frontend-app/build', 'index.html');
  if (fs.existsSync(indexPath)) {
    // Serve the index.html file from the frontend build directory for any unmatched routes
    res.sendFile(indexPath);
  } else {
    // If the frontend build directory doesn't exist, return a JSON response
    res.status(404).json({
      message: 'Frontend build not found',
      error: 'The frontend build directory does not exist. This server is configured to serve API requests only.'
    });
  }
});

module.exports = app;
