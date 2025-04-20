/**
 * Unified Result Routes
 *
 * This file contains all routes related to results, including:
 * - Result creation and retrieval
 * - Marks entry
 * - Report generation
 *
 * It replaces the previous separate route files:
 * - resultRoutes.js
 * - newResultRoutes.js
 * - resultReportRoutes.js
 * - oLevelResultRoutes.js
 * - aLevelResultRoutes.js
 */

const express = require('express');
const router = express.Router();
const ResultService = require('../../services/resultService');
const ReportService = require('../../services/reportService');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { validateResult, validateResultUpdate } = require('../../middleware/resultValidation');
const { checkExistingMarks, preventDuplicateMarks } = require('../../middleware/markEntryValidation');
const { validateReportRequest } = require('../../middleware/reportValidation');
const { ENDPOINTS, EDUCATION_LEVELS } = require('../../constants/apiEndpoints');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/v2/results
 * @desc    Create a new result
 * @access  Private (Admin, Teacher)
 */
router.post('/',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  validateResult,
  async (req, res) => {
    try {
      const result = await ResultService.createResult(req.body);
      logger.info(`Created result: ${result._id}`);
      res.status(201).json(result);
    } catch (error) {
      logger.error(`Error creating result: ${error.message}`);
      res.status(400).json({
        message: 'Error creating result',
        details: error.message,
        code: 'RESULT_CREATION_ERROR'
      });
    }
});

/**
 * @route   POST /api/v2/results/enter-marks
 * @desc    Enter marks for a student
 * @access  Private (Admin, Teacher)
 */
router.post('/enter-marks',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkExistingMarks,
  preventDuplicateMarks,
  async (req, res) => {
    try {
      const result = await ResultService.enterMarks(req.body);
      logger.info(`Entered marks for student ${req.body.studentId}, subject ${req.body.subjectId}`);
      res.status(201).json(result);
    } catch (error) {
      logger.error(`Error entering marks: ${error.message}`);
      res.status(400).json({
        message: 'Error entering marks',
        details: error.message,
        code: 'MARKS_ENTRY_ERROR'
      });
    }
});

/**
 * @route   POST /api/v2/results/enter-batch-marks
 * @desc    Enter batch marks for multiple students
 * @access  Private (Admin, Teacher)
 * @deprecated Use /api/o-level/marks/batch for O-Level or /api/a-level-results/batch for A-Level instead
 */
router.post('/enter-batch-marks',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    // Log deprecation warning
    logger.warn(`DEPRECATED ROUTE USED: ${req.method} ${req.originalUrl} - Use education level specific endpoints instead`);

    // Check if we can determine the education level
    const { marksData } = req.body;
    if (marksData && Array.isArray(marksData) && marksData.length > 0) {
      // Try to determine education level from the first mark
      const firstMark = marksData[0];
      if (firstMark.educationLevel) {
        const redirectEndpoint = firstMark.educationLevel === 'A_LEVEL'
          ? '/api/a-level-results/batch'
          : '/api/o-level/marks/batch';

        return res.status(301).json({
          success: false,
          message: `This route is deprecated. Please use ${redirectEndpoint} instead.`,
          redirectTo: redirectEndpoint
        });
      }
    }

    // If we can't determine the education level, provide both options
    return res.status(301).json({
      success: false,
      message: 'This route is deprecated. Please use /api/o-level/marks/batch for O-Level or /api/a-level-results/batch for A-Level instead.',
      redirectOptions: {
        oLevel: '/api/o-level/marks/batch',
        aLevel: '/api/a-level-results/batch'
      }
    });
  }
);

/**
 * @route   GET /api/v2/results
 * @desc    Get all results with pagination
 * @access  Private (Admin, Teacher)
 */
router.get('/',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, ...filters } = req.query;
      const results = await ResultService.getAllResults(
        parseInt(page),
        parseInt(limit),
        filters
      );
      res.json(results);
    } catch (error) {
      logger.error(`Error fetching results: ${error.message}`);
      res.status(500).json({
        message: 'Error fetching results',
        details: error.message,
        code: 'RESULTS_FETCH_ERROR'
      });
    }
});

/**
 * @route   GET /api/v2/results/student/:studentId
 * @desc    Get results for a specific student
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/student/:studentId',
  authenticateToken,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { examId, academicYear, term } = req.query;

      // Check if user has permission to access this student's results
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const results = await ResultService.getStudentResults(studentId, {
        examId,
        academicYear,
        term
      });

      res.json(results);
    } catch (error) {
      logger.error(`Error fetching student results: ${error.message}`);
      res.status(500).json({
        message: 'Error fetching student results',
        details: error.message,
        code: 'STUDENT_RESULTS_FETCH_ERROR'
      });
    }
});

/**
 * @route   GET /api/v2/results/subject/:subjectId
 * @desc    Get results for a specific subject
 * @access  Private (Admin, Teacher)
 */
router.get('/subject/:subjectId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { classId, examId, academicYear, term } = req.query;

      const results = await ResultService.getSubjectResults(subjectId, {
        classId,
        examId,
        academicYear,
        term
      });

      res.json(results);
    } catch (error) {
      logger.error(`Error fetching subject results: ${error.message}`);
      res.status(500).json({
        message: 'Error fetching subject results',
        details: error.message,
        code: 'SUBJECT_RESULTS_FETCH_ERROR'
      });
    }
});

/**
 * @route   GET /api/v2/results/class/:classId
 * @desc    Get results for a specific class
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { examId, academicYear, term, page = 1, limit = 50 } = req.query;

      const results = await ResultService.getClassResults(
        classId,
        {
          examId,
          academicYear,
          term
        },
        parseInt(page),
        parseInt(limit)
      );

      res.json(results);
    } catch (error) {
      logger.error(`Error fetching class results: ${error.message}`);
      res.status(500).json({
        message: 'Error fetching class results',
        details: error.message,
        code: 'CLASS_RESULTS_FETCH_ERROR'
      });
    }
});

/**
 * @route   GET /api/v2/results/report/student/:studentId/:examId
 * @desc    Get student result report
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/report/student/:studentId/:examId',
  authenticateToken,
  validateReportRequest,
  async (req, res) => {
    try {
      const { studentId, examId } = req.params;
      const { educationLevel, format = 'pdf' } = req.query;

      // Check if user has permission to access this student's report
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Generate report based on format
      if (format === 'json') {
        const report = await ReportService.generateStudentReportJson(studentId, examId, educationLevel);
        return res.json(report);
      } else {
        await ReportService.generateStudentReport(studentId, examId, res, educationLevel);
      }
    } catch (error) {
      logger.error(`Error generating student report: ${error.message}`);
      res.status(500).json({
        message: 'Error generating student report',
        details: error.message,
        code: 'STUDENT_REPORT_ERROR'
      });
    }
});

/**
 * @route   GET /api/v2/results/report/class/:classId/:examId
 * @desc    Get class result report
 * @access  Private (Admin, Teacher)
 */
router.get('/report/class/:classId/:examId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  validateReportRequest,
  async (req, res) => {
    try {
      const { classId, examId } = req.params;
      const { educationLevel, format = 'pdf', page = 1, limit = 50 } = req.query;

      // Generate report based on format
      if (format === 'json') {
        const report = await ReportService.generateClassReportJson(
          classId,
          examId,
          educationLevel,
          parseInt(page),
          parseInt(limit)
        );
        return res.json(report);
      } else {
        await ReportService.generateClassReport(classId, examId, res, educationLevel);
      }
    } catch (error) {
      logger.error(`Error generating class report: ${error.message}`);
      res.status(500).json({
        message: 'Error generating class report',
        details: error.message,
        code: 'CLASS_REPORT_ERROR'
      });
    }
});

/**
 * @route   POST /api/v2/results/report/send-sms/:studentId/:examId
 * @desc    Send result report via SMS
 * @access  Private (Admin, Teacher)
 */
router.post('/report/send-sms/:studentId/:examId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  validateReportRequest,
  async (req, res) => {
    try {
      const { studentId, examId } = req.params;
      const { educationLevel } = req.query;

      const result = await ReportService.sendReportSms(studentId, examId, educationLevel);

      res.json({
        success: true,
        message: 'SMS sent successfully',
        details: result
      });
    } catch (error) {
      logger.error(`Error sending report SMS: ${error.message}`);
      res.status(500).json({
        message: 'Error sending report SMS',
        details: error.message,
        code: 'REPORT_SMS_ERROR'
      });
    }
});

module.exports = router;
