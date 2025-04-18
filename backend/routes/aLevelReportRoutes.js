/**
 * A-Level Report Routes
 *
 * Standardized routes for A-Level result reports with consistent data schema
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkStudentEducationLevel, checkClassEducationLevel } = require('../middleware/educationLevelCheck');
const aLevelReportController = require('../controllers/aLevelReportController');

// Get student report with standardized schema
router.get('/student/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('A_LEVEL'),
  aLevelReportController.getStudentReport
);

// Get student-clean report (same as student report but with a different route for UI purposes)
router.get('/student-clean/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('A_LEVEL'),
  aLevelReportController.getStudentReport
);

// Get form-specific student reports
router.get('/form5/student/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('A_LEVEL'),
  (req, res, next) => {
    // Add form level to query params
    req.query.formLevel = '5';
    next();
  },
  aLevelReportController.getStudentReport
);

router.get('/form6/student/:studentId/:examId',
  authenticateToken,
  checkStudentEducationLevel('A_LEVEL'),
  (req, res, next) => {
    // Add form level to query params
    req.query.formLevel = '6';
    next();
  },
  aLevelReportController.getStudentReport
);

// Get class report with standardized schema
router.get('/class/:classId/:examId',
  (req, res, next) => {
    console.log(`A-Level class report route hit: classId=${req.params.classId}, examId=${req.params.examId}`);
    next();
  },
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkClassEducationLevel('A_LEVEL'),
  aLevelReportController.getClassReport
);

// Get class report with form level filter
router.get('/class/:classId/:examId/form/:formLevel',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkClassEducationLevel('A_LEVEL'),
  (req, res, next) => {
    // Add form level to query params
    req.query.formLevel = req.params.formLevel;
    next();
  },
  aLevelReportController.getClassReport
);

// Get form-specific class reports (legacy routes)
router.get('/form5/class/:classId/:examId',
  (req, res, next) => {
    console.log(`Form 5 A-Level class report route hit: classId=${req.params.classId}, examId=${req.params.examId}`);
    next();
  },
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkClassEducationLevel('A_LEVEL'),
  (req, res, next) => {
    // Add form level to query params
    req.query.formLevel = '5';
    next();
  },
  aLevelReportController.getClassReport
);

router.get('/form6/class/:classId/:examId',
  (req, res, next) => {
    console.log(`Form 6 A-Level class report route hit: classId=${req.params.classId}, examId=${req.params.examId}`);
    next();
  },
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkClassEducationLevel('A_LEVEL'),
  (req, res, next) => {
    // Add form level to query params
    req.query.formLevel = '6';
    next();
  },
  aLevelReportController.getClassReport
);

module.exports = router;
