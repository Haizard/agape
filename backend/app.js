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
const resultRoutes = require('./routes/resultRoutes');
const newResultRoutes = require('./routes/newResultRoutes');
const checkMarksRoutes = require('./routes/checkMarksRoutes');
const financeRoutes = require('./routes/financeRoutes');
const feeScheduleRoutes = require('./routes/feeScheduleRoutes');
const studentSubjectSelectionRoutes = require('./routes/studentSubjectSelectionRoutes');
const comprehensiveReportRoutes = require('./routes/comprehensiveReportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/school-frontend-app/build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  };

  // If MongoDB is not connected, return a 503 status
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ...healthData,
      status: 'DEGRADED',
      message: 'Database connection is not available'
    });
  }

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
app.use('/api/results', resultRoutes);
app.use('/api/v2/results', newResultRoutes);
app.use('/api/marks', checkMarksRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/finance/fee-schedules', feeScheduleRoutes);
app.use('/api/student-subject-selections', studentSubjectSelectionRoutes);
app.use('/api/results/comprehensive', comprehensiveReportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

module.exports = app;