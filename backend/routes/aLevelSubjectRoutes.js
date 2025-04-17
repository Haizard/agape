/**
 * A-Level Subject Routes
 * Handles API routes for A-Level subjects
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ALevelSubjectService = require('../services/ALevelSubjectService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/a-level-subjects
 * @desc    Get all A-Level subjects
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    logger.info('GET /api/a-level-subjects - Fetching all A-Level subjects');
    
    const subjects = await ALevelSubjectService.getAllALevelSubjects();
    
    logger.info(`GET /api/a-level-subjects - Found ${subjects.length} A-Level subjects`);
    res.json(subjects);
  } catch (error) {
    logger.error(`GET /api/a-level-subjects - Error: ${error.message}`);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/a-level-subjects/class/:classId
 * @desc    Get subjects for a specific A-Level class
 * @access  Private
 */
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    logger.info(`GET /api/a-level-subjects/class/${classId} - Fetching subjects for A-Level class`);
    
    const subjects = await ALevelSubjectService.getSubjectsForALevelClass(classId);
    
    logger.info(`GET /api/a-level-subjects/class/${classId} - Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (error) {
    logger.error(`GET /api/a-level-subjects/class/${req.params.classId} - Error: ${error.message}`);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   POST /api/a-level-subjects/clear-cache
 * @desc    Clear the A-Level subjects cache
 * @access  Private
 */
router.post('/clear-cache', authenticateToken, (req, res) => {
  try {
    logger.info('POST /api/a-level-subjects/clear-cache - Clearing A-Level subjects cache');
    
    ALevelSubjectService.clearCache();
    
    res.json({ message: 'A-Level subjects cache cleared successfully' });
  } catch (error) {
    logger.error(`POST /api/a-level-subjects/clear-cache - Error: ${error.message}`);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
