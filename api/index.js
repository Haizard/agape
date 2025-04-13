// Main API endpoint
const { connectToDatabase } = require('../backend/config/db');
const express = require('express');
const serverless = require('serverless-http');

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Import routes
const userRoutes = require('../backend/routes/userRoutes');
const classRoutes = require('../backend/routes/classRoutes');
const studentRoutes = require('../backend/routes/studentRoutes');
const subjectRoutes = require('../backend/routes/subjectRoutes');
const examRoutes = require('../backend/routes/examRoutes');
const resultRoutes = require('../backend/routes/resultRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);

// Connect to database
connectToDatabase();

// Export the serverless handler
module.exports = serverless(app);
