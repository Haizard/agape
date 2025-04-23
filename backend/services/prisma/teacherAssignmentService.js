/**
 * Prisma Teacher Assignment Service
 *
 * This service handles teacher assignments to subjects and classes using Prisma.
 * It provides a more consistent approach to teacher assignments, fixing the issue
 * where subject-teacher reassignment sometimes incorrectly reverts to using the admin's ID.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');

/**
 * Assign a teacher to a subject in a class
 * @param {Object} params - Assignment parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.teacherId - Teacher ID (can be null to remove assignment)
 * @param {string} params.assignedBy - User ID of the person making the assignment
 * @returns {Promise<Object>} - Result of the assignment
 */
async function assignTeacherToSubject(params) {
  const { classId, subjectId, teacherId, assignedBy } = params;

  try {
    logger.info(`[PrismaTeacherService] Assigning teacher ${teacherId} to subject ${subjectId} in class ${classId}`);

    // Check if teacher is an admin user (if teacherId is provided)
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true }
      });

      if (teacher?.user?.role === 'admin') {
        logger.warn(`[PrismaTeacherService] Cannot assign admin user as teacher: ${teacherId}`);
        return {
          success: false,
          message: 'Admin users cannot be assigned as teachers'
        };
      }
    }

    // Use a transaction to ensure all updates happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the ClassSubject record
      const classSubject = await tx.classSubject.upsert({
        where: {
          classId_subjectId: {
            classId,
            subjectId
          }
        },
        create: {
          classId,
          subjectId,
          teacherId
        },
        update: {
          teacherId
        }
      });

      // 2. Update or create TeacherSubject record if teacherId is provided
      if (teacherId) {
        await tx.teacherSubject.upsert({
          where: {
            teacherId_subjectId_classId: {
              teacherId,
              subjectId,
              classId
            }
          },
          create: {
            teacherId,
            subjectId,
            classId,
            status: 'active'
          },
          update: {
            status: 'active'
          }
        });
      } else {
        // If removing a teacher, mark existing records as inactive
        await tx.teacherSubject.updateMany({
          where: {
            subjectId,
            classId
          },
          data: {
            status: 'inactive'
          }
        });
      }

      return {
        success: true,
        message: teacherId
          ? `Teacher ${teacherId} assigned to subject ${subjectId} in class ${classId}`
          : `Teacher assignment removed for subject ${subjectId} in class ${classId}`,
        data: classSubject
      };
    });

    logger.info(`[PrismaTeacherService] Assignment successful: ${result.message}`);
    return result;
  } catch (error) {
    logger.error(`[PrismaTeacherService] Error assigning teacher: ${error.message}`, error);
    return {
      success: false,
      message: `Error assigning teacher: ${error.message}`,
      error
    };
  }
}

/**
 * Update multiple subject-teacher assignments for a class
 * @param {Object} params - Assignment parameters
 * @param {string} params.classId - Class ID
 * @param {Array} params.assignments - Array of {subjectId, teacherId} objects
 * @param {string} params.assignedBy - User ID of the person making the assignment
 * @returns {Promise<Object>} - Result of the assignment
 */
async function updateClassSubjectAssignments(params) {
  const { classId, assignments, assignedBy } = params;

  try {
    logger.info(`[PrismaTeacherService] Updating ${assignments.length} subject-teacher assignments for class ${classId}`);

    // Process each assignment in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const assignmentResults = [];

      for (const assignment of assignments) {
        const { subjectId, teacherId } = assignment;

        // Check if teacher is an admin user (if teacherId is provided)
        if (teacherId) {
          const teacher = await tx.teacher.findUnique({
            where: { id: teacherId },
            include: { user: true }
          });

          if (teacher?.user?.role === 'admin') {
            logger.warn(`[PrismaTeacherService] Cannot assign admin user as teacher: ${teacherId}`);
            assignmentResults.push({
              subjectId,
              teacherId,
              success: false,
              message: 'Admin users cannot be assigned as teachers'
            });
            continue;
          }
        }

        // 1. Update the ClassSubject record
        const classSubject = await tx.classSubject.upsert({
          where: {
            classId_subjectId: {
              classId,
              subjectId
            }
          },
          create: {
            classId,
            subjectId,
            teacherId
          },
          update: {
            teacherId
          }
        });

        // 2. Update or create TeacherSubject record if teacherId is provided
        if (teacherId) {
          await tx.teacherSubject.upsert({
            where: {
              teacherId_subjectId_classId: {
                teacherId,
                subjectId,
                classId
              }
            },
            create: {
              teacherId,
              subjectId,
              classId,
              status: 'active'
            },
            update: {
              status: 'active'
            }
          });
        } else {
          // If removing a teacher, mark existing records as inactive
          await tx.teacherSubject.updateMany({
            where: {
              subjectId,
              classId
            },
            data: {
              status: 'inactive'
            }
          });
        }

        assignmentResults.push({
          subjectId,
          teacherId,
          success: true,
          message: teacherId
            ? `Teacher ${teacherId} assigned to subject ${subjectId}`
            : `Teacher assignment removed for subject ${subjectId}`
        });
      }

      return assignmentResults;
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`[PrismaTeacherService] Assignment update completed: ${successCount} successful, ${failureCount} failed`);

    return {
      success: failureCount === 0,
      message: `Updated ${successCount} of ${results.length} assignments`,
      results
    };
  } catch (error) {
    logger.error(`[PrismaTeacherService] Error updating class subject assignments: ${error.message}`, error);
    return {
      success: false,
      message: `Error updating class subject assignments: ${error.message}`,
      error
    };
  }
}

/**
 * Get subjects assigned to a teacher for a specific class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result with assigned subjects
 */
async function getTeacherSubjectsForClass(teacherId, classId) {
  try {
    logger.info(`[PrismaTeacherService] Getting subjects for teacher ${teacherId} in class ${classId}`);

    // Get teacher's subject assignments for this class
    const assignments = await prisma.teacherSubject.findMany({
      where: {
        teacherId,
        classId,
        status: 'active'
      },
      include: {
        subject: true,
        class: true
      }
    });

    logger.info(`[PrismaTeacherService] Found ${assignments.length} subject assignments for teacher ${teacherId} in class ${classId}`);

    return {
      success: true,
      data: assignments
    };
  } catch (error) {
    logger.error(`[PrismaTeacherService] Error getting teacher subjects: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting teacher subjects: ${error.message}`,
      error
    };
  }
}

module.exports = {
  assignTeacherToSubject,
  updateClassSubjectAssignments,
  getTeacherSubjectsForClass
};
