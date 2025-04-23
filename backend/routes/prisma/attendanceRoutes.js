/**
 * Prisma Attendance Routes
 * 
 * These routes handle attendance-related operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { 
  recordAttendance, 
  recordBulkAttendance, 
  getStudentAttendance, 
  getClassAttendance, 
  getClassAttendanceSummary, 
  deleteAttendance 
} = require('../../services/prisma/attendanceService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/attendance
 * @desc    Record attendance for a student
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/attendance - Recording attendance');
    
    // Add the user ID as the recordedBy field if not provided
    if (!req.body.recordedBy) {
      req.body.recordedBy = req.user.userId;
    }
    
    const result = await recordAttendance(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error recording attendance: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/prisma/attendance/bulk
 * @desc    Record attendance for multiple students
 * @access  Private (Admin, Teacher)
 */
router.post('/bulk', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    logger.info('[Prisma] POST /api/prisma/attendance/bulk - Recording bulk attendance');
    
    const { attendanceRecords } = req.body;
    
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendance records provided or invalid format'
      });
    }
    
    // Add the user ID as the recordedBy field if not provided
    const recordsWithUser = attendanceRecords.map(record => ({
      ...record,
      recordedBy: record.recordedBy || req.user.userId
    }));
    
    const result = await recordBulkAttendance(recordsWithUser);
    
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
    logger.error(`[Prisma] Error recording bulk attendance: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/attendance/student/:studentId
 * @desc    Get attendance records for a student
 * @access  Private (Admin, Teacher, Parent, Student)
 */
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    logger.info(`[Prisma] GET /api/prisma/attendance/student/${studentId} - Getting student attendance`);
    
    // Check if the user is authorized to view this student's attendance
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s attendance'
      });
    }
    
    // If user is a parent, check if they are the parent of the student
    if (req.user.role === 'parent') {
      // This would require a parent-student relationship check
      // For now, we'll assume this check is done elsewhere
    }
    
    const result = await getStudentAttendance(studentId, { startDate, endDate });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting student attendance: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/attendance/class/:classId/date/:date
 * @desc    Get attendance records for a class on a specific date
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId/date/:date', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, date } = req.params;
    
    logger.info(`[Prisma] GET /api/prisma/attendance/class/${classId}/date/${date} - Getting class attendance`);
    
    const result = await getClassAttendance(classId, date);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting class attendance: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/prisma/attendance/class/:classId/summary
 * @desc    Get attendance summary for a class within a date range
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId/summary', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    logger.info(`[Prisma] GET /api/prisma/attendance/class/${classId}/summary - Getting class attendance summary`);
    
    const result = await getClassAttendanceSummary(classId, startDate, endDate);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error getting class attendance summary: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   DELETE /api/prisma/attendance/:id
 * @desc    Delete an attendance record
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`[Prisma] DELETE /api/prisma/attendance/${id} - Deleting attendance record`);
    
    const result = await deleteAttendance(id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error(`[Prisma] Error deleting attendance record: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
