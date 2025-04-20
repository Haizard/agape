/**
 * Unified Teacher Assignment Service
 *
 * This service centralizes all teacher-subject assignment logic in one place
 * to ensure consistency across all models and prevent accidental overrides.
 */

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const AcademicYear = require('../models/AcademicYear');
const User = require('../models/User');

/**
 * Assign a teacher to a subject in a class with comprehensive validation and logging
 * @param {Object} params - Assignment parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.teacherId - Teacher ID
 * @param {string} params.assignedBy - User ID of the person making the assignment
 * @param {boolean} params.allowAdminFallback - Whether to allow fallback to admin (default: false)
 * @param {boolean} params.updateAllModels - Whether to update all models (default: true)
 * @returns {Promise<Object>} - Result object with success status and details
 */
async function assignTeacherToSubject(params) {
  const {
    classId,
    subjectId,
    teacherId,
    assignedBy,
    allowAdminFallback = false,
    updateAllModels = true
  } = params;

  // Validate required parameters
  if (!classId || !subjectId) {
    console.error('[UnifiedTeacherAssignmentService] Missing required parameters:', { classId, subjectId });
    return {
      success: false,
      message: 'Class ID and Subject ID are required'
    };
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the class
    const classObj = await Class.findById(classId).session(session);
    if (!classObj) {
      await session.abortTransaction();
      session.endSession();
      console.error(`[UnifiedTeacherAssignmentService] Class not found: ${classId}`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }

    // Find the subject
    const subject = await Subject.findById(subjectId).session(session);
    if (!subject) {
      await session.abortTransaction();
      session.endSession();
      console.error(`[UnifiedTeacherAssignmentService] Subject not found: ${subjectId}`);
      return {
        success: false,
        message: `Subject with ID ${subjectId} not found`
      };
    }

    // Get the current academic year
    const academicYear = await AcademicYear.findOne({ isActive: true }).session(session);
    if (!academicYear) {
      await session.abortTransaction();
      session.endSession();
      console.error('[UnifiedTeacherAssignmentService] No active academic year found');
      return {
        success: false,
        message: 'No active academic year found'
      };
    }

    // Track the previous teacher for logging
    let previousTeacherId = null;

    // Find the subject in the class
    const subjectIndex = classObj.subjects.findIndex(s =>
      s.subject && s.subject.toString() === subjectId
    );

    if (subjectIndex >= 0) {
      // Get the previous teacher
      previousTeacherId = classObj.subjects[subjectIndex].teacher;
    }

    // Validate teacher ID if provided
    let teacher = null;
    if (teacherId) {
      // Log the teacher ID for debugging
      console.log(`[UnifiedTeacherAssignmentService] Validating teacher ID: ${teacherId}`);

      // Check if teacherId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        console.error(`[UnifiedTeacherAssignmentService] Invalid teacher ID format: ${teacherId}`);
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: `Invalid teacher ID format: ${teacherId}`
        };
      }

      teacher = await Teacher.findById(teacherId).session(session);
      if (!teacher) {
        await session.abortTransaction();
        session.endSession();
        console.error(`[UnifiedTeacherAssignmentService] Teacher not found: ${teacherId}`);
        return {
          success: false,
          message: `Teacher with ID ${teacherId} not found`
        };
      }

      // Check if this is an admin user and log it
      const teacherUser = await User.findById(teacher.userId).session(session);
      if (teacherUser && teacherUser.role === 'admin') {
        console.warn(`[UnifiedTeacherAssignmentService] WARNING: Assigning admin user ${teacherUser.username} (${teacherId}) to subject ${subjectId} in class ${classId}`);

        // NEVER allow admin users to be assigned as teachers
        console.error(`[UnifiedTeacherAssignmentService] Admin users cannot be assigned as teachers, rejecting assignment`);
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: 'Admin users cannot be assigned as teachers',
          details: {
            classId,
            subjectId,
            teacherId
          }
        };
      }
    } else if (!allowAdminFallback) {
      // If no teacher ID is provided and fallback is not allowed, keep the existing teacher
      if (subjectIndex >= 0 && classObj.subjects[subjectIndex].teacher) {
        console.log('[UnifiedTeacherAssignmentService] No teacher ID provided, keeping existing teacher');
        await session.abortTransaction();
        session.endSession();
        return {
          success: true,
          message: 'No changes made, keeping existing teacher assignment',
          details: {
            classId,
            subjectId,
            teacherId: classObj.subjects[subjectIndex].teacher
          }
        };
      }
    }

    // Track assignments made
    const assignments = {
      classModel: 0,
      teacherSubject: 0,
      teacherAssignment: 0
    };

    // 1. Update the Class model
    if (subjectIndex >= 0) {
      // Update existing subject assignment
      classObj.subjects[subjectIndex].teacher = teacherId;
      assignments.classModel++;
    } else {
      // Add new subject assignment
      classObj.subjects.push({
        subject: subjectId,
        teacher: teacherId
      });
      assignments.classModel++;
    }

    await classObj.save({ session });
    console.log(`[UnifiedTeacherAssignmentService] Updated Class.subjects: ${classId}.subjects[${subjectIndex}].teacher = ${teacherId}`);

    // 2. Update the other models if requested
    if (updateAllModels) {
      // Update TeacherSubject model
      if (teacherId) {
        // Check if assignment already exists
        const existingTeacherSubject = await TeacherSubject.findOne({
          teacherId: teacherId,
          subjectId: subjectId,
          classId: classId
        }).session(session);

        if (!existingTeacherSubject) {
          // Create new assignment
          const teacherSubject = new TeacherSubject({
            teacherId: teacherId,
            subjectId: subjectId,
            classId: classId,
            academicYearId: academicYear._id,
            status: 'active'
          });

          await teacherSubject.save({ session });
          assignments.teacherSubject++;
          console.log(`[UnifiedTeacherAssignmentService] Created TeacherSubject: ${teacherId}, ${subjectId}, ${classId}`);
        } else {
          // Update existing assignment
          existingTeacherSubject.status = 'active';
          await existingTeacherSubject.save({ session });
          console.log(`[UnifiedTeacherAssignmentService] Updated TeacherSubject: ${teacherId}, ${subjectId}, ${classId}`);
        }

        // Update TeacherAssignment model
        const existingTeacherAssignment = await TeacherAssignment.findOne({
          teacher: teacherId,
          subject: subjectId,
          class: classId
        }).session(session);

        if (!existingTeacherAssignment) {
          // Create new assignment
          const teacherAssignment = new TeacherAssignment({
            teacher: teacherId,
            subject: subjectId,
            class: classId,
            academicYear: academicYear._id,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          });

          await teacherAssignment.save({ session });
          assignments.teacherAssignment++;
          console.log(`[UnifiedTeacherAssignmentService] Created TeacherAssignment: ${teacherId}, ${subjectId}, ${classId}`);
        }

        // Update teacher's subjects array if not already included
        if (!teacher.subjects.includes(subjectId)) {
          teacher.subjects.push(subjectId);
          await teacher.save({ session });
          console.log(`[UnifiedTeacherAssignmentService] Added subject ${subjectId} to teacher ${teacherId}`);
        }
      } else if (previousTeacherId) {
        // If removing a teacher assignment, mark the TeacherSubject as inactive
        await TeacherSubject.updateMany(
          {
            subjectId: subjectId,
            classId: classId
          },
          { status: 'inactive' },
          { session }
        );
        console.log(`[UnifiedTeacherAssignmentService] Marked TeacherSubject assignments as inactive for subject ${subjectId} in class ${classId}`);
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Create an audit log entry
    const auditLog = {
      timestamp: new Date(),
      action: 'TEACHER_SUBJECT_ASSIGNMENT',
      details: {
        classId,
        subjectId,
        previousTeacherId,
        newTeacherId: teacherId,
        assignedBy
      }
    };
    console.log('[UnifiedTeacherAssignmentService] Assignment audit log:', auditLog);

    return {
      success: true,
      message: teacherId
        ? 'Teacher assigned to subject successfully'
        : 'Teacher assignment removed successfully',
      details: {
        classId,
        subjectId,
        teacherId,
        previousTeacherId,
        assignments
      }
    };
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error('[UnifiedTeacherAssignmentService] Error assigning teacher to subject:', error);
    return {
      success: false,
      message: 'Failed to assign teacher to subject',
      error: error.message
    };
  }
}

/**
 * Update multiple subject-teacher assignments for a class
 * @param {Object} params - Assignment parameters
 * @param {string} params.classId - Class ID
 * @param {Array} params.assignments - Array of {subjectId, teacherId} objects
 * @param {string} params.assignedBy - User ID of the person making the assignment
 * @param {boolean} params.allowAdminFallback - Whether to allow fallback to admin (default: false)
 * @param {boolean} params.updateAllModels - Whether to update all models (default: true)
 * @returns {Promise<Object>} - Result object with success status and details
 */
async function updateClassSubjectAssignments(params) {
  const {
    classId,
    assignments,
    assignedBy,
    allowAdminFallback = false,
    updateAllModels = true
  } = params;

  console.log('[UnifiedTeacherAssignmentService] updateClassSubjectAssignments called with params:', {
    classId,
    assignmentsCount: assignments?.length,
    assignedBy,
    allowAdminFallback,
    updateAllModels
  });

  if (assignments && assignments.length > 0) {
    console.log('[UnifiedTeacherAssignmentService] First few assignments:',
      assignments.slice(0, 3).map(a => ({ subjectId: a.subjectId, teacherId: a.teacherId || 'null' })));
  }

  // Validate required parameters
  if (!classId || !Array.isArray(assignments)) {
    console.error('[UnifiedTeacherAssignmentService] Missing required parameters:', { classId, assignments });
    return {
      success: false,
      message: 'Class ID and assignments array are required'
    };
  }

  try {
    // Find the class to get current assignments
    console.log(`[UnifiedTeacherAssignmentService] Finding class with ID: ${classId}`);
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.error(`[UnifiedTeacherAssignmentService] Class not found: ${classId}`);
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    console.log(`[UnifiedTeacherAssignmentService] Found class: ${classObj.name} (${classObj.educationLevel})`);

    // Create a map of current subject-teacher assignments
    const currentAssignments = {};
    console.log(`[UnifiedTeacherAssignmentService] Current subjects in class: ${classObj.subjects?.length || 0}`);
    for (const subjectAssignment of classObj.subjects) {
      if (subjectAssignment.subject) {
        const subjectId = subjectAssignment.subject.toString();
        currentAssignments[subjectId] = subjectAssignment.teacher;
        console.log(`[UnifiedTeacherAssignmentService] Current assignment: subject=${subjectId}, teacher=${subjectAssignment.teacher || 'null'}`);
      }
    }

    // Process each assignment
    const results = [];
    console.log(`[UnifiedTeacherAssignmentService] Processing ${assignments.length} assignments`);
    for (const assignment of assignments) {
      const { subjectId, teacherId } = assignment;

      // Skip invalid assignments
      if (!subjectId) {
        console.warn('[UnifiedTeacherAssignmentService] Skipping assignment with no subjectId');
        continue;
      }

      console.log(`[UnifiedTeacherAssignmentService] Processing assignment: subject=${subjectId}, teacher=${teacherId || 'null'}`);

      // Check if this is a change from the current assignment
      const currentTeacherId = currentAssignments[subjectId];
      console.log(`[UnifiedTeacherAssignmentService] Current teacher for subject ${subjectId}: ${currentTeacherId || 'null'}`);

      if (currentTeacherId && currentTeacherId.toString() === (teacherId || '').toString()) {
        // No change needed
        console.log(`[UnifiedTeacherAssignmentService] No change needed for subject ${subjectId}`);
        results.push({
          subjectId,
          teacherId,
          status: 'unchanged'
        });
        continue;
      }

      // If teacherId is provided, check if it's an admin user
      if (teacherId) {
        const teacher = await Teacher.findById(teacherId);
        if (teacher) {
          const teacherUser = await User.findById(teacher.userId);
          if (teacherUser && teacherUser.role === 'admin' && !allowAdminFallback) {
            console.warn(`[UnifiedTeacherAssignmentService] WARNING: Attempting to assign admin user ${teacherUser.username} as teacher for subject ${subjectId}`);
            results.push({
              subjectId,
              teacherId,
              status: 'failed',
              message: 'Cannot assign admin user as teacher unless explicitly allowed'
            });
            continue;
          }
        }
      }

      // Update the assignment
      const result = await assignTeacherToSubject({
        classId,
        subjectId,
        teacherId,
        assignedBy,
        allowAdminFallback,
        updateAllModels
      });

      results.push({
        subjectId,
        teacherId,
        status: result.success ? 'updated' : 'failed',
        message: result.message
      });
    }

    return {
      success: true,
      message: 'Class subject assignments updated',
      results
    };
  } catch (error) {
    console.error('[UnifiedTeacherAssignmentService] Error updating class subject assignments:', error);
    return {
      success: false,
      message: 'Failed to update class subject assignments',
      error: error.message
    };
  }
}

module.exports = {
  assignTeacherToSubject,
  updateClassSubjectAssignments
};
