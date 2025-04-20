/**
 * Enhanced Teacher Subject Service
 *
 * This service extends the original teacherSubjectService with improved handling
 * for O-Level classes, ensuring they work the same way as A-Level classes.
 */

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Student = require('../models/Student');

// Import the original service
const originalService = require('./teacherSubjectService');

// Cache for teacher-subject relationships
const cache = {
  teacherSubjects: new Map(), // Map of teacherId -> Map of classId -> subjects
  lastUpdated: new Map(), // Map of teacherId -> timestamp
  TTL: 1 * 60 * 1000, // 1 minute - reduced to ensure fresh data
};

/**
 * Get subjects assigned to a teacher for a specific class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID (optional)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @param {boolean} includeStudentSubjects - Whether to include subjects from students in the class (default: false)
 * @returns {Promise<Array>} - Array of subjects
 */
async function getTeacherSubjects(teacherId, classId = null, useCache = true, includeStudentSubjects = false) {
  console.log(`[EnhancedTeacherSubjectService] Getting subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ''}`);

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`[EnhancedTeacherSubjectService] Teacher not found: ${teacherId}`);
      return [];
    }

    // Create a map to store unique subjects
    const subjectMap = {};

    // Method 1: Get subjects directly assigned to the teacher in the Class model
    if (classId) {
      console.log(`[EnhancedTeacherSubjectService] Finding subjects for teacher ${teacherId} in class ${classId}`);

      // Find the class and check if it exists
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`[EnhancedTeacherSubjectService] Class not found: ${classId}`);
        return [];
      }

      // Log education level for debugging
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} education level: ${classObj.educationLevel || 'Not specified'}`);

      // Process each subject assignment in the class
      for (const subjectAssignment of classObj.subjects) {
        // For O-Level classes, we'll be more lenient with teacher assignments
        // If the teacher is assigned to any subject in the class, we'll consider them authorized for all subjects
        // This matches the behavior for A-Level classes

        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId.toString() &&
            subjectAssignment.subject) {

          // If the teacher is assigned to at least one subject, add all subjects to the map
          for (const allSubjectAssignment of classObj.subjects) {
            if (allSubjectAssignment.subject) {
              const subjectId = allSubjectAssignment.subject._id.toString();

              // If this subject is not in the map yet, add it
              if (!subjectMap[subjectId]) {
                subjectMap[subjectId] = {
                  _id: allSubjectAssignment.subject._id,
                  name: allSubjectAssignment.subject.name,
                  code: allSubjectAssignment.subject.code,
                  type: allSubjectAssignment.subject.type,
                  description: allSubjectAssignment.subject.description,
                  educationLevel: allSubjectAssignment.subject.educationLevel || 'UNKNOWN',
                  isPrincipal: allSubjectAssignment.subject.isPrincipal || false,
                  isCompulsory: allSubjectAssignment.subject.isCompulsory || false,
                  assignmentType: 'direct' // Directly assigned to teach this subject
                };
              }
            }
          }

          // Once we've found one assignment, we can break out of the loop
          // since we've already added all subjects
          break;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    if (classId) {
      const teacherSubjectAssignments = await TeacherSubject.find({
        teacherId: teacherId,
        classId: classId,
        status: 'active'
      }).populate('subjectId');

      if (teacherSubjectAssignments.length > 0) {
        // If the teacher has any TeacherSubject assignments for this class,
        // add all subjects in the class to the map
        const classObj = await Class.findById(classId)
          .populate({
            path: 'subjects.subject',
            model: 'Subject',
            select: 'name code type description educationLevel isPrincipal isCompulsory'
          });

        if (classObj) {
          for (const subjectAssignment of classObj.subjects) {
            if (subjectAssignment.subject) {
              const subjectId = subjectAssignment.subject._id.toString();

              // If this subject is not in the map yet, add it
              if (!subjectMap[subjectId]) {
                subjectMap[subjectId] = {
                  _id: subjectAssignment.subject._id,
                  name: subjectAssignment.subject.name,
                  code: subjectAssignment.subject.code,
                  type: subjectAssignment.subject.type,
                  description: subjectAssignment.subject.description,
                  educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
                  isPrincipal: subjectAssignment.subject.isPrincipal || false,
                  isCompulsory: subjectAssignment.subject.isCompulsory || false,
                  assignmentType: 'teacherSubject' // Assigned via TeacherSubject model
                };
              }
            }
          }
        }
      }
    }

    // Method 3: Check TeacherAssignment assignments
    if (classId) {
      const teacherAssignments = await TeacherAssignment.find({
        teacher: teacherId,
        class: classId
      });

      if (teacherAssignments.length > 0) {
        // If the teacher has any TeacherAssignment assignments for this class,
        // add all subjects in the class to the map
        const classObj = await Class.findById(classId)
          .populate({
            path: 'subjects.subject',
            model: 'Subject',
            select: 'name code type description educationLevel isPrincipal isCompulsory'
          });

        if (classObj) {
          for (const subjectAssignment of classObj.subjects) {
            if (subjectAssignment.subject) {
              const subjectId = subjectAssignment.subject._id.toString();

              // If this subject is not in the map yet, add it
              if (!subjectMap[subjectId]) {
                subjectMap[subjectId] = {
                  _id: subjectAssignment.subject._id,
                  name: subjectAssignment.subject.name,
                  code: subjectAssignment.subject.code,
                  type: subjectAssignment.subject.type,
                  description: subjectAssignment.subject.description,
                  educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
                  isPrincipal: subjectAssignment.subject.isPrincipal || false,
                  isCompulsory: subjectAssignment.subject.isCompulsory || false,
                  assignmentType: 'teacherAssignment' // Assigned via TeacherAssignment model
                };
              }
            }
          }
        }
      }
    }

    // Method 4: Check if the teacher is the class teacher
    if (classId) {
      const classObj = await Class.findOne({
        _id: classId,
        classTeacher: teacherId
      }).populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel isPrincipal isCompulsory'
      });

      if (classObj) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for class ${classId}`);

        // Add all subjects in the class to the map
        for (const subjectAssignment of classObj.subjects) {
          if (subjectAssignment.subject) {
            const subjectId = subjectAssignment.subject._id.toString();

            // If this subject is not in the map yet, add it
            if (!subjectMap[subjectId]) {
              subjectMap[subjectId] = {
                _id: subjectAssignment.subject._id,
                name: subjectAssignment.subject.name,
                code: subjectAssignment.subject.code,
                type: subjectAssignment.subject.type,
                description: subjectAssignment.subject.description,
                educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
                isPrincipal: subjectAssignment.subject.isPrincipal || false,
                isCompulsory: subjectAssignment.subject.isCompulsory || false,
                assignmentType: 'classTeacher' // Assigned as class teacher
              };
            }
          }
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`[EnhancedTeacherSubjectService] Found ${subjects.length} unique subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ' across all classes'}`);

    // If no subjects found and we're looking for a specific class, try to find subjects from other classes
    if (subjects.length === 0 && classId) {
      console.log(`[EnhancedTeacherSubjectService] WARNING: No subjects found for teacher ${teacherId} in class ${classId}`);

      // Let's check if the class exists and has subjects
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      } else {
        console.log(`[EnhancedTeacherSubjectService] Class ${classId} exists with ${classObj.subjects.length} subject assignments`);

        // For O-Level classes, if the teacher is in the Teacher model, allow them to see all subjects
        if (classObj.educationLevel === 'O_LEVEL') {
          console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class, returning all subjects`);

          // Add all subjects in the class to the map
          for (const subjectAssignment of classObj.subjects) {
            if (subjectAssignment.subject) {
              const subjectId = subjectAssignment.subject._id.toString();

              // If this subject is not in the map yet, add it
              if (!subjectMap[subjectId]) {
                subjectMap[subjectId] = {
                  _id: subjectAssignment.subject._id,
                  name: subjectAssignment.subject.name,
                  code: subjectAssignment.subject.code,
                  type: subjectAssignment.subject.type,
                  description: subjectAssignment.subject.description,
                  educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
                  isPrincipal: subjectAssignment.subject.isPrincipal || false,
                  isCompulsory: subjectAssignment.subject.isCompulsory || false,
                  assignmentType: 'oLevelFallback' // Special fallback for O-Level classes
                };
              }
            }
          }

          // Convert the map to an array again
          const oLevelSubjects = Object.values(subjectMap);
          console.log(`[EnhancedTeacherSubjectService] Returning ${oLevelSubjects.length} subjects for O-Level class ${classId}`);

          return oLevelSubjects;
        }
      }
    }

    return subjects;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error getting teacher subjects:`, error);
    return [];
  }
}

/**
 * Check if a teacher is authorized to teach a subject in a class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is authorized
 */
async function isTeacherAuthorizedForSubject(teacherId, classId, subjectId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is authorized to teach subject ${subjectId} in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // For O-Level classes, check if the teacher is assigned to any subject in the class
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // Check if the teacher is assigned to any subject in the class
      const isAssignedToAnySubject = await isTeacherAuthorizedForClass(teacherId, classId);

      if (isAssignedToAnySubject) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to at least one subject in O-Level class ${classId}, authorizing for all subjects`);
        return true;
      }
    }

    // For A-Level classes or if the teacher is not assigned to any subject in the O-Level class,
    // use the original service's method
    return await originalService.isTeacherAuthorizedForSubject(teacherId, classId, subjectId);
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher authorization:`, error);
    return false;
  }
}

/**
 * Check if a teacher is authorized to teach in a class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - Whether the teacher is authorized
 */
async function isTeacherAuthorizedForClass(teacherId, classId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is authorized to teach in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // For O-Level classes, check if the teacher exists in the Teacher model
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // Check if the teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} exists, authorizing for O-Level class ${classId}`);
        return true;
      }
    }

    // For A-Level classes or if the teacher doesn't exist,
    // use the original service's method
    return await originalService.isTeacherAuthorizedForClass(teacherId, classId);
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher authorization:`, error);
    return false;
  }
}

/**
 * Get students assigned to a teacher for a specific class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of students
 */
async function getTeacherStudents(teacherId, classId) {
  console.log(`[EnhancedTeacherSubjectService] Getting students for teacher ${teacherId} in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return [];
    }

    // For O-Level classes, we'll be more permissive
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // First check if the teacher is the class teacher
      if (classObj.classTeacher && classObj.classTeacher.toString() === teacherId.toString()) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for O-Level class ${classId}, returning all students`);

        // Get all students in the class
        const students = await Student.find({ class: classId })
          .select('_id firstName lastName rollNumber admissionNumber gender form');

        console.log(`[EnhancedTeacherSubjectService] Found ${students.length} students in O-Level class ${classId}`);
        return students;
      }

      // Then check if the teacher is assigned to any subject in the class
      if (classObj.subjects && Array.isArray(classObj.subjects)) {
        for (const subjectAssignment of classObj.subjects) {
          if (subjectAssignment.teacher && subjectAssignment.teacher.toString() === teacherId.toString()) {
            console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to a subject in O-Level class ${classId}, returning all students`);

            // Get all students in the class
            const students = await Student.find({ class: classId })
              .select('_id firstName lastName rollNumber admissionNumber gender form');

            console.log(`[EnhancedTeacherSubjectService] Found ${students.length} students in O-Level class ${classId}`);
            return students;
          }
        }
      }

      // Finally, check if the teacher exists in the Teacher model
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} exists, returning all students for O-Level class ${classId}`);

        // Get all students in the class
        const students = await Student.find({ class: classId })
          .select('_id firstName lastName rollNumber admissionNumber gender form');

        console.log(`[EnhancedTeacherSubjectService] Found ${students.length} students in O-Level class ${classId}`);
        return students;
      }
    }

    // For A-Level classes or if the teacher doesn't exist,
    // use the original service's method
    return await originalService.getTeacherStudents(teacherId, classId);
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error getting teacher students:`, error);
    return [];
  }
}

/**
 * Check if a teacher is assigned to a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to the class
 */
async function isTeacherAssignedToClass(teacherId, classId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is assigned to class ${classId}`);

  try {
    // Method 1: Check if the teacher is assigned to any subject in the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // Check if the teacher is the class teacher
    if (classObj.classTeacher && classObj.classTeacher.toString() === teacherId.toString()) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for class ${classId}`);
      return true;
    }

    // Check if the teacher is assigned to any subject in the class
    if (classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher && subjectAssignment.teacher.toString() === teacherId.toString()) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to a subject in class ${classId}`);
          return true;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId,
      status: 'active'
    });

    if (teacherSubjectAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherSubject assignments for class ${classId}`);
      return true;
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId
    });

    if (teacherAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherAssignment assignments for class ${classId}`);
      return true;
    }

    // For O-Level classes, check if the teacher exists in the Teacher model
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // Check if the teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} exists, authorizing for O-Level class ${classId}`);
        return true;
      }
    }

    console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is not assigned to class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher assignment:`, error);
    return false;
  }
}

/**
 * Check if a teacher is assigned to a subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to the subject
 */
async function isTeacherAssignedToSubject(teacherId, classId, subjectId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is assigned to subject ${subjectId} in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // For O-Level classes, we'll be more permissive
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // First check if the teacher is the class teacher
      if (classObj.classTeacher && classObj.classTeacher.toString() === teacherId.toString()) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for O-Level class ${classId}, authorizing for all subjects`);
        return true;
      }

      // Then check if the teacher is assigned to any subject in the class
      if (classObj.subjects && Array.isArray(classObj.subjects)) {
        for (const subjectAssignment of classObj.subjects) {
          if (subjectAssignment.teacher && subjectAssignment.teacher.toString() === teacherId.toString()) {
            console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to a subject in O-Level class ${classId}, authorizing for all subjects`);
            return true;
          }
        }
      }

      // Finally, check if the teacher exists in the Teacher model
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} exists, authorizing for all subjects in O-Level class ${classId}`);
        return true;
      }
    }

    // Method 1: Check if the teacher is directly assigned to the subject in the class
    if (classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.subject &&
            subjectAssignment.subject.toString() === subjectId.toString() &&
            subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId.toString()) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is directly assigned to subject ${subjectId} in class ${classId}`);
          return true;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId,
      subjectId: subjectId,
      status: 'active'
    });

    if (teacherSubjectAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherSubject assignments for subject ${subjectId} in class ${classId}`);
      return true;
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId,
      subject: subjectId
    });

    if (teacherAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherAssignment assignments for subject ${subjectId} in class ${classId}`);
      return true;
    }

    console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is not assigned to subject ${subjectId} in class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher subject assignment:`, error);
    return false;
  }
}

// Export the enhanced service methods
module.exports = {
  getTeacherSubjects,
  isTeacherAuthorizedForSubject,
  isTeacherAuthorizedForClass,
  getTeacherStudents,
  isTeacherAssignedToClass,
  isTeacherAssignedToSubject,
  // Re-export other methods from the original service
  getTeacherSubjectsForStudent: originalService.getTeacherSubjectsForStudent,
  clearCache: originalService.clearCache
};
