const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('node:path');
const teacherRoutes = require('./routes/teacherRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const smsRoutes = require('./routes/smsRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const examRoutes = require('./routes/examRoutes');
const markRoutes = require('./routes/markRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
// Import the unified result routes
const unifiedResultRoutes = require('./routes/v2/resultRoutes');
const checkMarksRoutes = require('./routes/checkMarksRoutes');
const financeRoutes = require('./routes/financeRoutes');
const feeScheduleRoutes = require('./routes/feeScheduleRoutes');
const studentSubjectSelectionRoutes = require('./routes/studentSubjectSelectionRoutes');
const comprehensiveReportRoutes = require('./routes/comprehensiveReportRoutes');
const unifiedComprehensiveReportRoutes = require('./routes/unifiedComprehensiveReportRoutes');
const marksHistoryRoutes = require('./routes/marksHistoryRoutes');
const demoDataRoutes = require('./routes/demoDataRoutes');
const publicReportRoutes = require('./routes/publicReportRoutes');
const aLevelReportRoutes = require('./routes/aLevelReportRoutes');
const oLevelReportRoutes = require('./routes/oLevelReportRoutes');
const standardizedOLevelRoutes = require('./routes/standardizedOLevelRoutes');
const fixTeacherRoute = require('./routes/fixTeacherRoute');
const enhancedTeacherRoutes = require('./routes/enhancedTeacherRoutes');
const studentImportRoutes = require('./routes/studentImportRoutes');
const fileUploadTestRoute = require('./routes/fileUploadTestRoute');

const app = express();

// Import custom CORS middleware
const { standardCors, openCors, handlePreflight } = require('./middleware/cors');

// Apply CORS middleware
app.use(standardCors);

// Apply preflight handler to all routes
app.use(handlePreflight);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/school-frontend-app/build')));

// Import logger at the top of the file
const logger = require('./utils/logger');

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  // If MongoDB is not connected, return a 503 status
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Health check: Database connection is not available');
    return res.status(503).json({
      ...healthData,
      status: 'DEGRADED',
      message: 'Database connection is not available',
      code: 'DB_CONNECTION_ERROR'
    });
  }

  logger.info(`Health check: System is healthy (${healthData.environment})`);
  res.json(healthData);
});

// Special route for login to handle CORS issues
app.options('/api/users/login', openCors, (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  console.log('OPTIONS request for /api/users/login received in app.js');
  res.sendStatus(204);
});

// Note: Teacher routes are now registered in index.js
// app.use('/api/teachers', enhancedTeacherRoutes); // Removed to prevent duplicate route registration
app.use('/api/settings', settingsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/users', openCors, userRoutes);

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
app.use('/api/upload-test', openCors, fileUploadTestRoute);
app.use('/api/classes', classRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/assessments', assessmentRoutes);
// Use the unified result routes
app.use('/api/v2/results', unifiedResultRoutes);
app.use('/api/marks', checkMarksRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/finance/fee-schedules', feeScheduleRoutes);
app.use('/api/student-subject-selections', studentSubjectSelectionRoutes);
// Teacher-subject assignment routes
app.use('/api/teacher-subject-assignments', require('./routes/teacherSubjectAssignmentRoutes'));
console.log('Teacher-subject assignment routes registered at /api/teacher-subject-assignments');

// Log all registered routes for debugging
const registeredRoutes = [];
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    // Routes registered directly on the app
    registeredRoutes.push(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach(handler => {
      if (handler.route) {
        const path = handler.route.path;
        const method = Object.keys(handler.route.methods)[0].toUpperCase();
        registeredRoutes.push(`${method} ${middleware.regexp} ${path}`);
      }
    });
  }
});
console.log('Registered routes:', registeredRoutes);
// Public routes - no authentication required
app.use('/api/public', openCors, publicReportRoutes);
// Marks history routes
app.use('/api/marks-history', marksHistoryRoutes);
// Legacy routes - will be deprecated in future versions
app.use('/api/results/comprehensive', unifiedComprehensiveReportRoutes);
// Keep old route for backward compatibility
app.use('/api/results/comprehensive-old', comprehensiveReportRoutes);
// New standardized A-Level report routes
app.use('/api/a-level-reports', aLevelReportRoutes);
console.log('A-Level report routes registered at /api/a-level-reports');

// New standardized O-Level report routes
app.use('/api/o-level-reports', oLevelReportRoutes);
console.log('O-Level report routes registered at /api/o-level-reports');

// New consolidated O-Level routes (will eventually replace all other O-Level routes)
app.use('/api/o-level', standardizedOLevelRoutes);
console.log('Standardized O-Level routes registered at /api/o-level');

// Fix teacher route
app.use('/api/fix-teacher', fixTeacherRoute);
console.log('Fix teacher route registered at /api/fix-teacher');

// Enhanced teacher routes are now mounted at /api/teachers



// Add deprecation notice for old routes
app.use('/api/o-level-results', (req, res, next) => {
  console.warn(`Deprecated route accessed: ${req.method} ${req.originalUrl}`);
  logger.warn(`Deprecated route accessed: ${req.method} ${req.originalUrl}. Please use /api/o-level instead.`);
  // Add deprecation header
  res.setHeader('X-Deprecated', 'This route is deprecated. Please use /api/o-level instead.');
  next();
});

// Old A-Level result routes have been removed
// All A-Level report functionality is now handled by /api/a-level-reports
// All O-Level report functionality is now handled by /api/o-level-reports

// Demo data routes for testing
app.use('/api/demo', demoDataRoutes);

// Debug routes
app.use('/api/debug', require('./routes/debugRoutes'));

// Proxy specific routes to demo data for testing
// This allows using the real frontend components with demo data
const USE_DEMO_DATA = process.env.USE_DEMO_DATA === 'true' && process.env.NODE_ENV !== 'production';
if (USE_DEMO_DATA) {
  logger.info('Using demo data for specific routes in development mode');

  // Proxy A-Level class report requests to demo data
  app.use('/api/a-level-reports/class/:classId/:examId', (req, res, next) => {
    if (req.params.classId === 'CLS001' && req.params.examId === 'EXAM001') {
      logger.info(`Proxying A-Level class report request to demo data: ${req.originalUrl}`);
      req.url = `/demo/a-level-reports/class/${req.params.classId}/${req.params.examId}`;
      return demoDataRoutes(req, res, next);
    }
    next();
  });

  // Proxy A-Level student report requests to demo data
  app.use('/api/a-level-reports/student/:studentId/:examId', (req, res, next) => {
    if (req.params.examId === 'EXAM001' && req.params.studentId.startsWith('STU')) {
      logger.info(`Proxying A-Level student report request to demo data: ${req.originalUrl}`);
      req.url = `/demo/a-level-reports/student/${req.params.studentId}/${req.params.examId}`;
      return demoDataRoutes(req, res, next);
    }
    next();
  });

  // Proxy special class report page requests to demo data
  app.use('/api/results/class-report/demo-class/demo-exam', (req, res, next) => {
    logger.info(`Proxying special class report page request to demo data: ${req.originalUrl}`);
    req.url = '/demo/results/class-report/demo-class/demo-exam';
    return demoDataRoutes(req, res, next);
  });

  // Proxy classes requests to demo data when specific query parameters are present
  app.use('/api/classes', (req, res, next) => {
    if (req.query.demo === 'true') {
      logger.info(`Proxying classes request to demo data: ${req.originalUrl}`);
      req.url = '/demo/classes';
      return demoDataRoutes(req, res, next);
    }
    next();
  });

  // Proxy exams requests to demo data when specific query parameters are present
  app.use('/api/exams', (req, res, next) => {
    if (req.query.demo === 'true' || req.query.class === 'CLS001') {
      logger.info(`Proxying exams request to demo data: ${req.originalUrl}`);
      req.url = '/demo/exams';
      return demoDataRoutes(req, res, next);
    }
    next();
  });

  // Proxy students requests to demo data when specific query parameters are present
  app.use('/api/students', (req, res, next) => {
    if (req.query.demo === 'true' || req.query.class === 'CLS001') {
      logger.info(`Proxying students request to demo data: ${req.originalUrl}`);
      req.url = '/demo/students';
      return demoDataRoutes(req, res, next);
    }
    next();
  });

  // Proxy specific student requests to demo data
  app.use('/api/students/:id', (req, res, next) => {
    if (req.params.id.startsWith('STU')) {
      logger.info(`Proxying student request to demo data: ${req.originalUrl}`);
      req.url = `/demo/students/${req.params.id}`;
      return demoDataRoutes(req, res, next);
    }
    next();
  });
}

// Error handling middleware uses the logger imported above

// Error handling middleware
app.use((err, req, res, next) => {
  const errorCode = logger.error(`Unhandled error: ${err.message}`, {
    error: err,
    stack: err.stack,
    req: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body
    }
  });
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    errorCode,
    code: 'SERVER_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
});

module.exports = app;
