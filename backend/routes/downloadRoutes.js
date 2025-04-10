const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const { authenticateToken } = require('../middleware/auth');

// Test PDF route - no authentication required for testing
router.get('/test', downloadController.generateTestPDF);

// Simple student result PDF route
router.get('/student/:studentId/:examId', authenticateToken, downloadController.generateSimpleStudentPDF);

// Simple class result PDF route
router.get('/class/:classId/:examId', authenticateToken, downloadController.generateSimpleClassPDF);

module.exports = router;
