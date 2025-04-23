/**
 * Prisma Timetable Routes
 * 
 * These routes handle timetable-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { 
  createTimetable, 
  addSession, 
  addMultipleSessions, 
  getTimetableById, 
  getTimetablesByClass, 
  getActiveTimetableForClass, 
  getTeacherTimetable, 
  updateTimetable, 
  updateSession, 
  deleteSession, 
  deleteTimetable 
} = require('../../services/prisma/timetableService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/timetables
 * @desc    Create a new timetable
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/timetables - Creating new timetable');
    
    // Add the user ID as the createdBy field if not provided
    if (!req.body.createdBy) {
      req.body.createdBy = req.user.userId;
    }
    
    const result = await createTimetable(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Timetable created successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error creating timetable: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/timetables/:timetableId/sessions
 * @desc    Add a session to a timetable
 * @access  Private (Admin)
 */
router.post('/:timetableId/sessions', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { timetableId } = req.params;
    
    logger.info(`[Prisma] POST /api/prisma/timetables/${timetableId}/sessions - Adding session`);
    
    const result = await addSession({
      ...req.body,
      timetableId
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Session added successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error adding session: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/timetables/:timetableId/sessions/bulk
 * @desc    Add multiple sessions to a timetable
 * @access  Private (Admin)
 */
router.post('/:timetableId/sessions/bulk', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { timetableId } = req.params;
    const { sessions } = req.body;
    
    logger.info(`[Prisma] POST /api/prisma/timetables/${timetableId}/sessions/bulk - Adding multiple sessions`);
    
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No sessions provided or invalid format'
      });
    }
    
    const result = await addMultipleSessions(timetableId, sessions);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: result.data
      });
    }
    
    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error adding multiple sessions: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/timetables/:id
 * @desc    Get timetable by ID
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/timetables/${id} - Getting timetable by ID`);
    
    const result = await getTimetableById(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting timetable: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/timetables/class/:classId
 * @desc    Get timetables by class
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYearId, termId } = req.query;
    
    logger.info(`[Prisma] GET /api/prisma/timetables/class/${classId} - Getting timetables by class`);
    
    const result = await getTimetablesByClass(classId, academicYearId, termId);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting timetables by class: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/timetables/class/:classId/active
 * @desc    Get active timetable for a class
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/class/:classId/active', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/timetables/class/${classId}/active - Getting active timetable for class`);
    
    const result = await getActiveTimetableForClass(classId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting active timetable: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/timetables/teacher/:teacherId
 * @desc    Get timetable for a teacher
 * @access  Private (Admin, Teacher)
 */
router.get('/teacher/:teacherId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYearId, termId } = req.query;
    
    // Check if the user is authorized to view this teacher's timetable
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this teacher\'s timetable'
      });
    }
    
    logger.info(`[Prisma] GET /api/prisma/timetables/teacher/${teacherId} - Getting teacher timetable`);
    
    const result = await getTeacherTimetable(teacherId, academicYearId, termId);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting teacher timetable: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   PUT /api/prisma/timetables/:id
 * @desc    Update a timetable
 * @access  Private (Admin)
 */
router.put('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`[Prisma] PUT /api/prisma/timetables/${id} - Updating timetable`);
    
    const result = await updateTimetable(id, req.body);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error updating timetable: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   PUT /api/prisma/timetables/sessions/:sessionId
 * @desc    Update a timetable session
 * @access  Private (Admin)
 */
router.put('/sessions/:sessionId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    logger.info(`[Prisma] PUT /api/prisma/timetables/sessions/${sessionId} - Updating session`);
    
    const result = await updateSession(sessionId, req.body);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error updating session: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   DELETE /api/prisma/timetables/sessions/:sessionId
 * @desc    Delete a timetable session
 * @access  Private (Admin)
 */
router.delete('/sessions/:sessionId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    logger.info(`[Prisma] DELETE /api/prisma/timetables/sessions/${sessionId} - Deleting session`);
    
    const result = await deleteSession(sessionId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error(`[Prisma] Error deleting session: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   DELETE /api/prisma/timetables/:id
 * @desc    Delete a timetable
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`[Prisma] DELETE /api/prisma/timetables/${id} - Deleting timetable`);
    
    const result = await deleteTimetable(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error(`[Prisma] Error deleting timetable: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
