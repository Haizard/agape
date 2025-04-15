const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
// Import the unified result routes
const unifiedResultRoutes = require('./routes/v2/resultRoutes');
const checkMarksRoutes = require('./routes/checkMarksRoutes');
const financeRoutes = require('./routes/financeRoutes');
const feeScheduleRoutes = require('./routes/feeScheduleRoutes');
const studentSubjectSelectionRoutes = require('./routes/studentSubjectSelectionRoutes');
const comprehensiveReportRoutes = require('./routes/comprehensiveReportRoutes');
const marksHistoryRoutes = require('./routes/marksHistoryRoutes');
const demoDataRoutes = require('./routes/demoDataRoutes');

const app = express();

// Import custom CORS middleware
const { standardCors, openCors, handlePreflight } = require('./middleware/cors');

// Apply CORS middleware
app.use(standardCors);

// Handle preflight requests
app.options('*', openCors);

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

// Routes
app.use('/api/teachers', teacherRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/users', openCors, userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/marks', markRoutes);
// Use the unified result routes
app.use('/api/v2/results', unifiedResultRoutes);
app.use('/api/marks', checkMarksRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/finance/fee-schedules', feeScheduleRoutes);
app.use('/api/student-subject-selections', studentSubjectSelectionRoutes);
// Marks history routes
app.use('/api/marks-history', marksHistoryRoutes);
// Legacy routes - will be deprecated in future versions
app.use('/api/results/comprehensive', comprehensiveReportRoutes);
// Demo data routes for testing
app.use('/api/demo', demoDataRoutes);

// Proxy specific routes to demo data for testing
// This allows using the real frontend components with demo data
const USE_DEMO_DATA = process.env.USE_DEMO_DATA === 'true';
if (USE_DEMO_DATA) {
  logger.info('Using demo data for specific routes');

  // Proxy A-Level Form 5 class report requests to demo data
  app.use('/api/a-level-results/form5/class/:classId/:examId', (req, res, next) => {
    if (req.params.classId === 'CLS001' && req.params.examId === 'EXAM001') {
      logger.info(`Proxying A-Level Form 5 class report request to demo data: ${req.originalUrl}`);
      req.url = `/demo/a-level-results/form5/class/${req.params.classId}/${req.params.examId}`;
      return demoDataRoutes(req, res, next);
    }
    next();
  });

  // Proxy A-Level Form 5 student report requests to demo data
  app.use('/api/a-level-results/form5/student/:studentId/:examId', (req, res, next) => {
    if (req.params.examId === 'EXAM001' && req.params.studentId.startsWith('STU')) {
      logger.info(`Proxying A-Level Form 5 student report request to demo data: ${req.originalUrl}`);
      req.url = `/demo/a-level-results/form5/student/${req.params.studentId}/${req.params.examId}`;
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
  const errorCode = logger.error(`Unhandled error: ${err.message}`, err);
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
