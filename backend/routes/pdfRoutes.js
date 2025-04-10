const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/newPdfController');
const { authenticateToken } = require('../middleware/auth');

// Generate student result PDF
router.get('/student/:studentId/:examId', authenticateToken, pdfController.generateStudentResultPDF);

// Generate class result PDF
router.get('/class/:classId/:examId', authenticateToken, pdfController.generateClassResultPDF);

module.exports = router;
