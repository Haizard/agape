/**
 * Prisma Routes Index
 *
 * This file exports all Prisma-based routes to be registered in the main app.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// Import Prisma routes
const teacherSubjectAssignmentRoutes = require('./teacherSubjectAssignmentRoutes');
const studentRoutes = require('./studentRoutes');
const subjectSelectionRoutes = require('./subjectSelectionRoutes');
const subjectAssignmentRoutes = require('./subjectAssignmentRoutes');
const oLevelMarksRoutes = require('./oLevelMarksRoutes');
const oLevelResultsRoutes = require('./oLevelResultsRoutes');
const unifiedMarksRoutes = require('./unifiedMarksRoutes');
const unifiedResultsRoutes = require('./unifiedResultsRoutes');
const examRoutes = require('./examRoutes');
const resultsRoutes = require('./resultsRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const timetableRoutes = require('./timetableRoutes');

// Register routes
router.use('/teacher-subject-assignments', teacherSubjectAssignmentRoutes);
router.use('/students', studentRoutes);
router.use('/student-subject-selections', subjectSelectionRoutes);
router.use('/subject-assignments', subjectAssignmentRoutes);
router.use('/o-level/marks', oLevelMarksRoutes);
router.use('/o-level/results', oLevelResultsRoutes);
router.use('/marks', unifiedMarksRoutes);
router.use('/results', unifiedResultsRoutes);
router.use('/exams', examRoutes);
router.use('/results/legacy', resultsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/timetables', timetableRoutes);

// Health check route
router.get('/health', (req, res) => {
  logger.info('[Prisma] GET /api/prisma/health - Health check');
  res.json({
    status: 'ok',
    message: 'Prisma API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
