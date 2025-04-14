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
const demoDataRoutes = require('./routes/demoDataRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://agape-school-system.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// Routes
app.use('/api/teachers', teacherRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/users', userRoutes);
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
// Legacy routes - will be deprecated in future versions
app.use('/api/results/comprehensive', comprehensiveReportRoutes);
// Demo data routes for testing
app.use('/api/demo', demoDataRoutes);

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
