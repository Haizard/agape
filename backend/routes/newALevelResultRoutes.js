/**
 * New A-Level Result Routes
 *
 * This file contains all routes related to A-Level results
 * with improved structure and error handling.
 */
const express = require('express');
const router = express.Router();
const newALevelResultController = require('../controllers/newALevelResultController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkStudentEducationLevel, checkClassEducationLevel } = require('../middleware/educationLevelCheck');
const { checkTeacherSubjectAssignments } = require('../middleware/teacherSubjectCheck');
const logger = require('../utils/logger');
const aLevelResultController = require('../controllers/aLevelResultController');

// Log all requests to this router
router.use((req, res, next) => {
  logger.info(`New A-Level Result API Request: ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * @route   GET /api/new-a-level/results
 * @desc    Get all A-Level results
 * @access  Private (Admin, Teacher)
 */
router.get('/results',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  newALevelResultController.getAllResults
);

/**
 * @route   GET /api/new-a-level/results/student/:studentId
 * @desc    Get A-Level results by student ID
 * @access  Private (Admin, Teacher)
 */
router.get('/results/student/:studentId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkStudentEducationLevel('A_LEVEL'),
  newALevelResultController.getResultsByStudent
);

/**
 * @route   GET /api/new-a-level/results/exam/:examId
 * @desc    Get A-Level results by exam ID
 * @access  Private (Admin, Teacher)
 */
router.get('/results/exam/:examId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  newALevelResultController.getResultsByExam
);

/**
 * @route   GET /api/new-a-level/results/student/:studentId/exam/:examId
 * @desc    Get A-Level results by student ID and exam ID
 * @access  Private (Admin, Teacher)
 */
router.get('/results/student/:studentId/exam/:examId',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkStudentEducationLevel('A_LEVEL'),
  newALevelResultController.getResultsByStudentAndExam
);

/**
 * @route   POST /api/new-a-level/results
 * @desc    Create a new A-Level result
 * @access  Private (Admin, Teacher)
 */
router.post('/results',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  newALevelResultController.createResult
);

/**
 * @route   PUT /api/new-a-level/results/:id
 * @desc    Update an A-Level result
 * @access  Private (Admin, Teacher)
 */
router.put('/results/:id',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  newALevelResultController.updateResult
);

/**
 * @route   DELETE /api/new-a-level/results/:id
 * @desc    Delete an A-Level result
 * @access  Private (Admin)
 */
router.delete('/results/:id',
  authenticateToken,
  authorizeRole(['admin']),
  newALevelResultController.deleteResult
);

/**
 * @route   POST /api/new-a-level/results/batch
 * @desc    Batch create A-Level results
 * @access  Private (Admin, Teacher)
 */
router.post('/results/batch',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  newALevelResultController.batchCreateResults
);

/**
 * @route   GET /api/new-a-level/teacher-subjects
 * @desc    Get subjects for a teacher in a class
 * @access  Private (Admin, Teacher)
 */
router.get('/teacher-subjects',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  checkTeacherSubjectAssignments(true),
  async (req, res) => {
    try {
      // The middleware has already attached the teacher subjects to the request
      res.json({
        success: true,
        usingFallback: req.usingFallback || false,
        subjects: req.teacherSubjects || []
      });
    } catch (error) {
      logger.error(`Error fetching teacher subjects: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher subjects',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/new-a-level/students-by-class-and-subject
 * @desc    Get students by class and subject
 * @access  Private (Admin, Teacher)
 */
router.get('/students-by-class-and-subject',
  authenticateToken,
  authorizeRole(['admin', 'teacher']),
  aLevelResultController.getStudentsByClassAndSubject
);

module.exports = router;
