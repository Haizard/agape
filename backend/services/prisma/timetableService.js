/**
 * Prisma Timetable Service
 * 
 * This service handles timetable-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Create a new timetable
 * @param {Object} timetableData - Timetable data
 * @returns {Promise<Object>} - Result of the operation
 */
async function createTimetable(timetableData) {
  const {
    name,
    description,
    academicYearId,
    termId,
    classId,
    createdBy,
    isActive = false
  } = timetableData;
  
  try {
    logger.info(`[PrismaTimetableService] Creating new timetable: ${name}`);
    
    // Validate required fields
    if (!name || !academicYearId || !termId || !classId || !createdBy) {
      return {
        success: false,
        message: 'Missing required fields: name, academicYearId, termId, classId, createdBy'
      };
    }
    
    // Create timetable
    const timetable = await prisma.timetable.create({
      data: {
        name,
        description,
        academicYearId,
        termId,
        classId,
        createdBy,
        isActive
      }
    });
    
    logger.info(`[PrismaTimetableService] Timetable created successfully: ${timetable.id}`);
    
    return {
      success: true,
      data: timetable
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error creating timetable: ${error.message}`, error);
    return {
      success: false,
      message: `Error creating timetable: ${error.message}`,
      error
    };
  }
}

/**
 * Add a session to a timetable
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} - Result of the operation
 */
async function addSession(sessionData) {
  const {
    timetableId,
    subjectId,
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    roomId,
    notes
  } = sessionData;
  
  try {
    logger.info(`[PrismaTimetableService] Adding session to timetable ${timetableId}`);
    
    // Validate required fields
    if (!timetableId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return {
        success: false,
        message: 'Missing required fields: timetableId, subjectId, teacherId, dayOfWeek, startTime, endTime'
      };
    }
    
    // Check if timetable exists
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId }
    });
    
    if (!timetable) {
      return {
        success: false,
        message: `Timetable with ID ${timetableId} not found`
      };
    }
    
    // Check for session conflicts
    const conflictingSession = await prisma.timetableSession.findFirst({
      where: {
        timetableId,
        dayOfWeek,
        OR: [
          {
            // Session starts during another session
            startTime: {
              lte: endTime
            },
            endTime: {
              gte: startTime
            }
          }
        ]
      }
    });
    
    if (conflictingSession) {
      return {
        success: false,
        message: `Session conflicts with an existing session on ${dayOfWeek} from ${conflictingSession.startTime} to ${conflictingSession.endTime}`
      };
    }
    
    // Create session
    const session = await prisma.timetableSession.create({
      data: {
        timetableId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        roomId,
        notes
      }
    });
    
    logger.info(`[PrismaTimetableService] Session added successfully: ${session.id}`);
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error adding session: ${error.message}`, error);
    return {
      success: false,
      message: `Error adding session: ${error.message}`,
      error
    };
  }
}

/**
 * Add multiple sessions to a timetable
 * @param {string} timetableId - Timetable ID
 * @param {Array} sessions - Array of session data objects
 * @returns {Promise<Object>} - Result of the operation
 */
async function addMultipleSessions(timetableId, sessions) {
  try {
    logger.info(`[PrismaTimetableService] Adding ${sessions.length} sessions to timetable ${timetableId}`);
    
    // Check if timetable exists
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId }
    });
    
    if (!timetable) {
      return {
        success: false,
        message: `Timetable with ID ${timetableId} not found`
      };
    }
    
    const results = [];
    const errors = [];
    
    // Process each session
    for (const sessionData of sessions) {
      const result = await addSession({
        ...sessionData,
        timetableId
      });
      
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          data: sessionData,
          error: result.message
        });
      }
    }
    
    return {
      success: errors.length === 0,
      message: `Added ${results.length} sessions, failed ${errors.length} sessions`,
      data: {
        results,
        errors
      }
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error adding multiple sessions: ${error.message}`, error);
    return {
      success: false,
      message: `Error adding multiple sessions: ${error.message}`,
      error
    };
  }
}

/**
 * Get timetable by ID
 * @param {string} timetableId - Timetable ID
 * @returns {Promise<Object>} - Timetable details
 */
async function getTimetableById(timetableId) {
  try {
    logger.info(`[PrismaTimetableService] Getting timetable by ID: ${timetableId}`);
    
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        academicYear: true,
        term: true,
        class: true,
        sessions: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            room: true
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });
    
    if (!timetable) {
      logger.warn(`[PrismaTimetableService] Timetable not found: ${timetableId}`);
      return {
        success: false,
        message: 'Timetable not found'
      };
    }
    
    return {
      success: true,
      data: timetable
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error getting timetable: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting timetable: ${error.message}`,
      error
    };
  }
}

/**
 * Get timetables by class
 * @param {string} classId - Class ID
 * @param {string} academicYearId - Academic year ID (optional)
 * @param {string} termId - Term ID (optional)
 * @returns {Promise<Object>} - List of timetables
 */
async function getTimetablesByClass(classId, academicYearId = null, termId = null) {
  try {
    logger.info(`[PrismaTimetableService] Getting timetables for class: ${classId}`);
    
    const whereClause = { classId };
    
    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }
    
    if (termId) {
      whereClause.termId = termId;
    }
    
    const timetables = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        academicYear: true,
        term: true,
        class: true,
        _count: {
          select: { sessions: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return {
      success: true,
      data: timetables
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error getting timetables by class: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting timetables by class: ${error.message}`,
      error
    };
  }
}

/**
 * Get active timetable for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Active timetable
 */
async function getActiveTimetableForClass(classId) {
  try {
    logger.info(`[PrismaTimetableService] Getting active timetable for class: ${classId}`);
    
    const timetable = await prisma.timetable.findFirst({
      where: {
        classId,
        isActive: true
      },
      include: {
        academicYear: true,
        term: true,
        class: true,
        sessions: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            room: true
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });
    
    if (!timetable) {
      logger.warn(`[PrismaTimetableService] No active timetable found for class: ${classId}`);
      return {
        success: false,
        message: 'No active timetable found for this class'
      };
    }
    
    return {
      success: true,
      data: timetable
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error getting active timetable: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting active timetable: ${error.message}`,
      error
    };
  }
}

/**
 * Get timetable for a teacher
 * @param {string} teacherId - Teacher ID
 * @param {string} academicYearId - Academic year ID (optional)
 * @param {string} termId - Term ID (optional)
 * @returns {Promise<Object>} - Teacher's timetable
 */
async function getTeacherTimetable(teacherId, academicYearId = null, termId = null) {
  try {
    logger.info(`[PrismaTimetableService] Getting timetable for teacher: ${teacherId}`);
    
    const whereClause = {};
    
    if (academicYearId) {
      whereClause.timetable = {
        academicYearId
      };
    }
    
    if (termId) {
      whereClause.timetable = {
        ...whereClause.timetable,
        termId
      };
    }
    
    // Get all sessions for the teacher
    const sessions = await prisma.timetableSession.findMany({
      where: {
        teacherId,
        ...whereClause
      },
      include: {
        timetable: {
          include: {
            class: true,
            academicYear: true,
            term: true
          }
        },
        subject: true,
        room: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    // Group sessions by day of week
    const sessionsByDay = {};
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    days.forEach(day => {
      sessionsByDay[day] = sessions.filter(session => session.dayOfWeek === day);
    });
    
    return {
      success: true,
      data: {
        teacherId,
        academicYearId,
        termId,
        sessionsByDay,
        totalSessions: sessions.length
      }
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error getting teacher timetable: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting teacher timetable: ${error.message}`,
      error
    };
  }
}

/**
 * Update a timetable
 * @param {string} timetableId - Timetable ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated timetable
 */
async function updateTimetable(timetableId, updateData) {
  try {
    logger.info(`[PrismaTimetableService] Updating timetable: ${timetableId}`);
    
    // Check if timetable exists
    const existingTimetable = await prisma.timetable.findUnique({
      where: { id: timetableId }
    });
    
    if (!existingTimetable) {
      logger.warn(`[PrismaTimetableService] Timetable not found: ${timetableId}`);
      return {
        success: false,
        message: 'Timetable not found'
      };
    }
    
    // If setting this timetable as active, deactivate other timetables for the same class
    if (updateData.isActive) {
      await prisma.timetable.updateMany({
        where: {
          classId: existingTimetable.classId,
          id: {
            not: timetableId
          }
        },
        data: {
          isActive: false
        }
      });
    }
    
    // Update timetable
    const updatedTimetable = await prisma.timetable.update({
      where: { id: timetableId },
      data: updateData
    });
    
    logger.info(`[PrismaTimetableService] Timetable updated successfully: ${timetableId}`);
    
    return {
      success: true,
      data: updatedTimetable
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error updating timetable: ${error.message}`, error);
    return {
      success: false,
      message: `Error updating timetable: ${error.message}`,
      error
    };
  }
}

/**
 * Update a timetable session
 * @param {string} sessionId - Session ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated session
 */
async function updateSession(sessionId, updateData) {
  try {
    logger.info(`[PrismaTimetableService] Updating session: ${sessionId}`);
    
    // Check if session exists
    const existingSession = await prisma.timetableSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!existingSession) {
      logger.warn(`[PrismaTimetableService] Session not found: ${sessionId}`);
      return {
        success: false,
        message: 'Session not found'
      };
    }
    
    // If updating time or day, check for conflicts
    if (updateData.startTime || updateData.endTime || updateData.dayOfWeek) {
      const startTime = updateData.startTime || existingSession.startTime;
      const endTime = updateData.endTime || existingSession.endTime;
      const dayOfWeek = updateData.dayOfWeek || existingSession.dayOfWeek;
      
      const conflictingSession = await prisma.timetableSession.findFirst({
        where: {
          id: {
            not: sessionId
          },
          timetableId: existingSession.timetableId,
          dayOfWeek,
          OR: [
            {
              // Session starts during another session
              startTime: {
                lte: endTime
              },
              endTime: {
                gte: startTime
              }
            }
          ]
        }
      });
      
      if (conflictingSession) {
        return {
          success: false,
          message: `Session conflicts with an existing session on ${dayOfWeek} from ${conflictingSession.startTime} to ${conflictingSession.endTime}`
        };
      }
    }
    
    // Update session
    const updatedSession = await prisma.timetableSession.update({
      where: { id: sessionId },
      data: updateData
    });
    
    logger.info(`[PrismaTimetableService] Session updated successfully: ${sessionId}`);
    
    return {
      success: true,
      data: updatedSession
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error updating session: ${error.message}`, error);
    return {
      success: false,
      message: `Error updating session: ${error.message}`,
      error
    };
  }
}

/**
 * Delete a timetable session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function deleteSession(sessionId) {
  try {
    logger.info(`[PrismaTimetableService] Deleting session: ${sessionId}`);
    
    // Check if session exists
    const existingSession = await prisma.timetableSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!existingSession) {
      logger.warn(`[PrismaTimetableService] Session not found: ${sessionId}`);
      return {
        success: false,
        message: 'Session not found'
      };
    }
    
    // Delete session
    await prisma.timetableSession.delete({
      where: { id: sessionId }
    });
    
    logger.info(`[PrismaTimetableService] Session deleted successfully: ${sessionId}`);
    
    return {
      success: true,
      message: 'Session deleted successfully'
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error deleting session: ${error.message}`, error);
    return {
      success: false,
      message: `Error deleting session: ${error.message}`,
      error
    };
  }
}

/**
 * Delete a timetable
 * @param {string} timetableId - Timetable ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function deleteTimetable(timetableId) {
  try {
    logger.info(`[PrismaTimetableService] Deleting timetable: ${timetableId}`);
    
    // Check if timetable exists
    const existingTimetable = await prisma.timetable.findUnique({
      where: { id: timetableId }
    });
    
    if (!existingTimetable) {
      logger.warn(`[PrismaTimetableService] Timetable not found: ${timetableId}`);
      return {
        success: false,
        message: 'Timetable not found'
      };
    }
    
    // Delete all sessions first
    await prisma.timetableSession.deleteMany({
      where: { timetableId }
    });
    
    // Delete timetable
    await prisma.timetable.delete({
      where: { id: timetableId }
    });
    
    logger.info(`[PrismaTimetableService] Timetable deleted successfully: ${timetableId}`);
    
    return {
      success: true,
      message: 'Timetable deleted successfully'
    };
  } catch (error) {
    logger.error(`[PrismaTimetableService] Error deleting timetable: ${error.message}`, error);
    return {
      success: false,
      message: `Error deleting timetable: ${error.message}`,
      error
    };
  }
}

module.exports = {
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
};
