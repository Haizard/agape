/**
 * O-Level Report Routes
 *
 * Provides standardized endpoints for O-Level result reports with consistent data schema
 * and centralized calculation logic.
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkStudentEducationLevel, checkClassEducationLevel } = require('../middleware/educationLevelCheck');
const oLevelReportController = require('../controllers/oLevelReportController');
const logger = require('../utils/logger');

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
  logger.info('O-Level report routes test endpoint accessed');
  res.json({ message: 'O-Level report routes are working' });
});

// Get student report with standardized schema
router.get('/student/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('O_LEVEL'),
  oLevelReportController.getStudentReport
);

// Get student-clean report (same as student report but with a different route for UI purposes)
router.get('/student-clean/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('O_LEVEL'),
  oLevelReportController.getStudentReport
);

// Get class report with standardized schema
router.get('/class/:classId/:examId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkClassEducationLevel('O_LEVEL'),
  oLevelReportController.getClassReport
);

module.exports = router;
