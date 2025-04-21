/**
 * Utility functions to fix teacher-subject assignments
 */
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const logger = require('./logger');

/**
 * Fix teacher-subject assignments for a specific class and subject
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function fixTeacherSubjectAssignment(classId, subjectId, teacherId) {
  try {
    logger.info(`Fixing teacher-subject assignment: class=${classId}, subject=${subjectId}, teacher=${teacherId}`);

    // Verify the class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      logger.error(`Class ${classId} not found`);
      return {
        success: false,
        message: 'Class not found'
      };
    }

    // Verify the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      logger.error(`Subject ${subjectId} not found`);
      return {
        success: false,
        message: 'Subject not found'
      };
    }

    // Verify the teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      logger.error(`Teacher ${teacherId} not found`);
      return {
        success: false,
        message: 'Teacher not found'
      };
    }

    // Fix assignment in Class model
    let classUpdated = false;
    if (classObj.subjects && Array.isArray(classObj.subjects)) {
      let subjectFound = false;
      for (let i = 0; i < classObj.subjects.length; i++) {
        const subjectAssignment = classObj.subjects[i];
        const assignedSubjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;

        if (assignedSubjectId === subjectId) {
          subjectFound = true;
          if (subjectAssignment.teacher?.toString() !== teacherId) {
            classObj.subjects[i].teacher = teacherId;
            classUpdated = true;
          }
          break;
        }
      }

      if (!subjectFound) {
        classObj.subjects.push({
          subject: subjectId,
          teacher: teacherId
        });
        classUpdated = true;
      }

      if (classUpdated) {
        await classObj.save();
        logger.info(`Updated Class model: class=${classId}, subject=${subjectId}, teacher=${teacherId}`);
      }
    }

    // Fix assignment in TeacherSubject model
    let teacherSubject = await TeacherSubject.findOne({
      teacherId,
      classId,
      subjectId
    });

    if (!teacherSubject) {
      teacherSubject = new TeacherSubject({
        teacherId,
        classId,
        subjectId,
        status: 'active'
      });
      await teacherSubject.save();
      logger.info(`Created TeacherSubject: class=${classId}, subject=${subjectId}, teacher=${teacherId}`);
    } else if (teacherSubject.status !== 'active') {
      teacherSubject.status = 'active';
      await teacherSubject.save();
      logger.info(`Updated TeacherSubject status: class=${classId}, subject=${subjectId}, teacher=${teacherId}`);
    }

    // Fix assignment in TeacherAssignment model
    let teacherAssignment = await TeacherAssignment.findOne({
      teacher: teacherId,
      class: classId,
      subject: subjectId
    });

    // Get the current academic year
    const currentDate = new Date();
    const academicYear = await mongoose.model('AcademicYear').findOne({
      $or: [
        { // Check if current date is within academic year range
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate }
        },
        { // Or get the most recent academic year
          year: { $gte: currentDate.getFullYear() - 1 }
        }
      ]
    }).sort({ year: -1 }).limit(1);

    if (!academicYear) {
      logger.error('No academic year found for teacher assignment');
      return {
        success: false,
        message: 'No academic year found for teacher assignment'
      };
    }

    // Set default start and end dates if not available in academic year
    const startDate = academicYear.startDate || new Date(currentDate.getFullYear(), 0, 1); // Jan 1 of current year
    const endDate = academicYear.endDate || new Date(currentDate.getFullYear(), 11, 31); // Dec 31 of current year

    if (!teacherAssignment) {
      teacherAssignment = new TeacherAssignment({
        teacher: teacherId,
        class: classId,
        subject: subjectId,
        academicYear: academicYear._id,
        startDate,
        endDate
      });
      await teacherAssignment.save();
      logger.info(`Created TeacherAssignment: class=${classId}, subject=${subjectId}, teacher=${teacherId}, academicYear=${academicYear.year}`);
    } else {
      // Update the academic year, start date, and end date if needed
      let updated = false;

      if (!teacherAssignment.academicYear || teacherAssignment.academicYear.toString() !== academicYear._id.toString()) {
        teacherAssignment.academicYear = academicYear._id;
        updated = true;
      }

      if (!teacherAssignment.startDate) {
        teacherAssignment.startDate = startDate;
        updated = true;
      }

      if (!teacherAssignment.endDate) {
        teacherAssignment.endDate = endDate;
        updated = true;
      }

      if (updated) {
        await teacherAssignment.save();
        logger.info(`Updated TeacherAssignment: class=${classId}, subject=${subjectId}, teacher=${teacherId}, academicYear=${academicYear.year}`);
      }
    }

    return {
      success: true,
      message: 'Teacher-subject assignment fixed successfully',
      details: {
        classUpdated,
        teacherSubjectCreated: !teacherSubject._id,
        teacherAssignmentCreated: !teacherAssignment._id
      }
    };
  } catch (error) {
    logger.error(`Error fixing teacher-subject assignment: ${error.message}`);
    return {
      success: false,
      message: 'Error fixing teacher-subject assignment',
      error: error.message
    };
  }
}

module.exports = {
  fixTeacherSubjectAssignment
};
