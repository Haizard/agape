/**
 * Prisma Attendance Service
 * 
 * This service handles attendance-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Record attendance for a student
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<Object>} - Result of the operation
 */
async function recordAttendance(attendanceData) {
  const {
    studentId,
    date,
    status,
    reason,
    recordedBy,
    classId
  } = attendanceData;
  
  try {
    logger.info(`[PrismaAttendanceService] Recording attendance for student ${studentId} on ${date}`);
    
    // Validate required fields
    if (!studentId || !date || !status || !recordedBy) {
      return {
        success: false,
        message: 'Missing required fields: studentId, date, status, recordedBy'
      };
    }
    
    // Format date to ensure it's a Date object
    const attendanceDate = new Date(date);
    
    // Check if attendance record already exists for this student on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: {
          gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
        }
      }
    });
    
    let attendance;
    
    if (existingAttendance) {
      // Update existing attendance record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          reason,
          recordedBy,
          updatedAt: new Date()
        }
      });
      
      logger.info(`[PrismaAttendanceService] Updated attendance record: ${attendance.id}`);
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          studentId,
          date: attendanceDate,
          status,
          reason,
          recordedBy,
          classId
        }
      });
      
      logger.info(`[PrismaAttendanceService] Created new attendance record: ${attendance.id}`);
    }
    
    return {
      success: true,
      data: attendance
    };
  } catch (error) {
    logger.error(`[PrismaAttendanceService] Error recording attendance: ${error.message}`, error);
    return {
      success: false,
      message: `Error recording attendance: ${error.message}`,
      error
    };
  }
}

/**
 * Record attendance for multiple students
 * @param {Array} attendanceDataArray - Array of attendance data objects
 * @returns {Promise<Object>} - Result of the operation
 */
async function recordBulkAttendance(attendanceDataArray) {
  try {
    logger.info(`[PrismaAttendanceService] Recording bulk attendance for ${attendanceDataArray.length} students`);
    
    const results = [];
    const errors = [];
    
    // Process each attendance record
    for (const attendanceData of attendanceDataArray) {
      const result = await recordAttendance(attendanceData);
      
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          data: attendanceData,
          error: result.message
        });
      }
    }
    
    return {
      success: errors.length === 0,
      message: `Recorded ${results.length} attendance records, failed ${errors.length} records`,
      data: {
        results,
        errors
      }
    };
  } catch (error) {
    logger.error(`[PrismaAttendanceService] Error recording bulk attendance: ${error.message}`, error);
    return {
      success: false,
      message: `Error recording bulk attendance: ${error.message}`,
      error
    };
  }
}

/**
 * Get attendance records for a student
 * @param {string} studentId - Student ID
 * @param {Object} options - Query options (startDate, endDate)
 * @returns {Promise<Object>} - Student attendance records
 */
async function getStudentAttendance(studentId, options = {}) {
  try {
    logger.info(`[PrismaAttendanceService] Getting attendance for student ${studentId}`);
    
    const { startDate, endDate } = options;
    
    const whereClause = {
      studentId
    };
    
    // Add date range if provided
    if (startDate || endDate) {
      whereClause.date = {};
      
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }
    
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: attendanceRecords
    };
  } catch (error) {
    logger.error(`[PrismaAttendanceService] Error getting student attendance: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting student attendance: ${error.message}`,
      error
    };
  }
}

/**
 * Get attendance records for a class on a specific date
 * @param {string} classId - Class ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Class attendance records
 */
async function getClassAttendance(classId, date) {
  try {
    logger.info(`[PrismaAttendanceService] Getting attendance for class ${classId} on ${date}`);
    
    // Format date to ensure it's a Date object
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));
    
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true
      }
    });
    
    // Get attendance records for the class on the specified date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    
    // Map attendance records to students
    const studentsWithAttendance = students.map(student => {
      const attendanceRecord = attendanceRecords.find(record => record.studentId === student.id);
      
      return {
        ...student,
        attendance: attendanceRecord || null
      };
    });
    
    return {
      success: true,
      data: {
        date: date,
        students: studentsWithAttendance,
        presentCount: attendanceRecords.filter(record => record.status === 'PRESENT').length,
        absentCount: attendanceRecords.filter(record => record.status === 'ABSENT').length,
        lateCount: attendanceRecords.filter(record => record.status === 'LATE').length,
        excusedCount: attendanceRecords.filter(record => record.status === 'EXCUSED').length,
        totalStudents: students.length
      }
    };
  } catch (error) {
    logger.error(`[PrismaAttendanceService] Error getting class attendance: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting class attendance: ${error.message}`,
      error
    };
  }
}

/**
 * Get attendance summary for a class within a date range
 * @param {string} classId - Class ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Class attendance summary
 */
async function getClassAttendanceSummary(classId, startDate, endDate) {
  try {
    logger.info(`[PrismaAttendanceService] Getting attendance summary for class ${classId} from ${startDate} to ${endDate}`);
    
    // Format dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true
      }
    });
    
    // Get attendance records for the class within the date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: start,
          lte: end
        }
      }
    });
    
    // Calculate the number of school days in the date range
    const schoolDays = await calculateSchoolDays(start, end);
    
    // Calculate attendance statistics for each student
    const studentSummaries = students.map(student => {
      const studentRecords = attendanceRecords.filter(record => record.studentId === student.id);
      
      const presentCount = studentRecords.filter(record => record.status === 'PRESENT').length;
      const absentCount = studentRecords.filter(record => record.status === 'ABSENT').length;
      const lateCount = studentRecords.filter(record => record.status === 'LATE').length;
      const excusedCount = studentRecords.filter(record => record.status === 'EXCUSED').length;
      
      const attendanceRate = schoolDays > 0 ? (presentCount / schoolDays) * 100 : 0;
      
      return {
        ...student,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        totalRecords: studentRecords.length
      };
    });
    
    return {
      success: true,
      data: {
        startDate,
        endDate,
        schoolDays,
        students: studentSummaries,
        totalStudents: students.length
      }
    };
  } catch (error) {
    logger.error(`[PrismaAttendanceService] Error getting class attendance summary: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting class attendance summary: ${error.message}`,
      error
    };
  }
}

/**
 * Calculate the number of school days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<number>} - Number of school days
 */
async function calculateSchoolDays(startDate, endDate) {
  // This is a simplified implementation
  // In a real-world scenario, you would need to account for weekends, holidays, etc.
  
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((startDate - endDate) / oneDay)) + 1;
  
  // Subtract weekends (assuming Saturday and Sunday are weekends)
  let weekends = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 is Sunday, 6 is Saturday
      weekends++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return diffDays - weekends;
}

/**
 * Delete an attendance record
 * @param {string} attendanceId - Attendance record ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function deleteAttendance(attendanceId) {
  try {
    logger.info(`[PrismaAttendanceService] Deleting attendance record ${attendanceId}`);
    
    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });
    
    if (!existingAttendance) {
      logger.warn(`[PrismaAttendanceService] Attendance record not found: ${attendanceId}`);
      return {
        success: false,
        message: 'Attendance record not found'
      };
    }
    
    // Delete attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId }
    });
    
    logger.info(`[PrismaAttendanceService] Attendance record deleted successfully: ${attendanceId}`);
    
    return {
      success: true,
      message: 'Attendance record deleted successfully'
    };
  } catch (error) {
    logger.error(`[PrismaAttendanceService] Error deleting attendance record: ${error.message}`, error);
    return {
      success: false,
      message: `Error deleting attendance record: ${error.message}`,
      error
    };
  }
}

module.exports = {
  recordAttendance,
  recordBulkAttendance,
  getStudentAttendance,
  getClassAttendance,
  getClassAttendanceSummary,
  deleteAttendance
};
