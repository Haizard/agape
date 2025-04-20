/**
 * O-Level Teacher Subject Service
 *
 * This service provides specialized handling for O-Level teacher-subject relationships.
 * It ensures strict filtering based on teacher assignments and provides consistent
 * behavior across all O-Level endpoints.
 */

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherAssignment = require('../models/TeacherAssignment');
const TeacherSubject = require('../models/TeacherSubject');
const Student = require('../models/Student');
const StudentSubjectSelection = require('../models/StudentSubjectSelection');

// Cache for teacher-subject relationships
const cache = {
  teacherSubjects: new Map(), // Map of teacherId -> Map of classId -> subjects
  lastUpdated: new Map(), // Map of teacherId -> timestamp
  TTL: 1 * 60 * 1000, // 1 minute - reduced to ensure fresh data
};

/**
 * Check if a teacher is assigned to teach a specific subject in a class
 * This is a strict check that only returns true if the teacher is explicitly assigned to the subject
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to the subject
 */
async function isTeacherAssignedToSubject(teacherId, classId, subjectId) {
  console.log(`[OLevelTeacherSubjectService] Checking if teacher ${teacherId} is assigned to subject ${subjectId} in class ${classId}`);

  try {
    // Method 1: Check if the teacher is directly assigned to this subject in the Class model
    const classObj = await Class.findById(classId);
    if (classObj && classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        const assignedSubjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;
        const assignedTeacherId = subjectAssignment.teacher?.toString();

        if (assignedSubjectId === subjectId && assignedTeacherId === teacherId.toString()) {
          console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} is directly assigned to subject ${subjectId} in class ${classId} via Class model`);
          return true;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignment = await TeacherSubject.findOne({
      teacherId: teacherId,
      classId: classId,
      subjectId: subjectId,
      status: 'active'
    });

    if (teacherSubjectAssignment) {
      console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} has a TeacherSubject assignment for subject ${subjectId} in class ${classId}`);
      return true;
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignment = await TeacherAssignment.findOne({
      teacher: teacherId,
      class: classId,
      subject: subjectId
    });

    if (teacherAssignment) {
      console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} has a TeacherAssignment for subject ${subjectId} in class ${classId}`);
      return true;
    }

    console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} is NOT assigned to subject ${subjectId} in class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[OLevelTeacherSubjectService] Error checking teacher subject assignment:`, error);
    return false;
  }
}

/**
 * Get all subjects a teacher is assigned to teach in a specific class
 * This is a strict check that only returns subjects the teacher is explicitly assigned to
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of subjects
 */
async function getTeacherSubjectsInClass(teacherId, classId) {
  console.log(`[OLevelTeacherSubjectService] Getting subjects for teacher ${teacherId} in class ${classId}`);

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`[OLevelTeacherSubjectService] Teacher not found: ${teacherId}`);
      return [];
    }

    // Find the class
    const classObj = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel isPrincipal isCompulsory'
      });

    if (!classObj) {
      console.log(`[OLevelTeacherSubjectService] Class not found: ${classId}`);
      return [];
    }

    // Create a map to store unique subjects
    const subjectMap = {};

    // Method 1: Check subjects directly assigned to the teacher in this class
    if (classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId &&
            subjectAssignment.subject) {

          const subjectId = subjectAssignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              type: subjectAssignment.subject.type,
              description: subjectAssignment.subject.description,
              educationLevel: subjectAssignment.subject.educationLevel || 'O_LEVEL',
              isPrincipal: subjectAssignment.subject.isPrincipal || false,
              isCompulsory: subjectAssignment.subject.isCompulsory || false,
              assignmentType: 'direct' // Directly assigned to teach this subject
            };
            console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} is directly assigned to teach ${subjectAssignment.subject.name} in class ${classId}`);
          }
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId,
      status: 'active'
    }).populate('subjectId');

    for (const assignment of teacherSubjectAssignments) {
      if (assignment.subjectId) {
        const subjectId = assignment.subjectId._id.toString();

        // If this subject is not in the map yet, add it
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            _id: assignment.subjectId._id,
            name: assignment.subjectId.name,
            code: assignment.subjectId.code,
            type: assignment.subjectId.type,
            description: assignment.subjectId.description,
            educationLevel: assignment.subjectId.educationLevel || 'O_LEVEL',
            isPrincipal: assignment.subjectId.isPrincipal || false,
            isCompulsory: assignment.subjectId.isCompulsory || false,
            assignmentType: 'teacherSubject' // From TeacherSubject model
          };
          console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} has a TeacherSubject assignment for ${assignment.subjectId.name} in class ${classId}`);
        }
      }
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId
    }).populate('subject');

    for (const assignment of teacherAssignments) {
      if (assignment.subject) {
        const subjectId = assignment.subject._id.toString();

        // If this subject is not in the map yet, add it
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            _id: assignment.subject._id,
            name: assignment.subject.name,
            code: assignment.subject.code,
            type: assignment.subject.type,
            description: assignment.subject.description,
            educationLevel: assignment.subject.educationLevel || 'O_LEVEL',
            isPrincipal: assignment.subject.isPrincipal || false,
            isCompulsory: assignment.subject.isCompulsory || false,
            assignmentType: 'teacherAssignment' // From TeacherAssignment model
          };
          console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} has a TeacherAssignment for ${assignment.subject.name} in class ${classId}`);
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`[OLevelTeacherSubjectService] Found ${subjects.length} unique subjects for teacher ${teacherId} in class ${classId}`);

    return subjects;
  } catch (error) {
    console.error(`[OLevelTeacherSubjectService] Error getting teacher subjects:`, error);
    return [];
  }
}

/**
 * Get students who take a specific subject in a class
 * This filters students based on their subject selections
 *
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Array>} - Array of students
 */
async function getStudentsForSubject(classId, subjectId) {
  console.log(`[OLevelTeacherSubjectService] Getting students for subject ${subjectId} in class ${classId}`);

  try {
    // Get the subject to check if it's a core subject
    const subject = await Subject.findById(subjectId);
    const isCoreSubject = subject && subject.type === 'CORE';

    // Get all students in the class
    const students = await Student.find({ class: classId })
      .select('firstName lastName rollNumber gender educationLevel selectedSubjects')
      .sort({ firstName: 1, lastName: 1 });

    console.log(`[OLevelTeacherSubjectService] Found ${students.length} students in class ${classId}`);

    // If it's a core subject, all students take it
    if (isCoreSubject) {
      console.log(`[OLevelTeacherSubjectService] Subject ${subjectId} is a core subject, all students take it`);
      return students;
    }

    // If it's an optional subject, filter students who have selected it
    console.log(`[OLevelTeacherSubjectService] Subject ${subjectId} is an optional subject, filtering students`);

    // Create a set of student IDs who take this subject
    const studentIdSet = new Set();

    // Method 1: Check the Student model's selectedSubjects field
    for (const student of students) {
      if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
        const selectedSubjects = student.selectedSubjects.map(s => s.toString());
        if (selectedSubjects.includes(subjectId)) {
          studentIdSet.add(student._id.toString());
          console.log(`[OLevelTeacherSubjectService] Student ${student._id} takes subject ${subjectId} (from Student model)`);
        }
      }
    }

    // Method 2: Check the StudentSubjectSelection model
    const studentIds = students.map(s => s._id);
    const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

    for (const selection of selections) {
      const studentId = selection.student.toString();
      const coreSubjects = selection.coreSubjects.map(s => s.toString());
      const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

      if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
        studentIdSet.add(studentId);
        console.log(`[OLevelTeacherSubjectService] Student ${studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
      }
    }

    // Filter students who take this subject
    const filteredStudents = students.filter(student => 
      studentIdSet.has(student._id.toString()));

    console.log(`[OLevelTeacherSubjectService] Found ${filteredStudents.length} students who take subject ${subjectId} in class ${classId}`);

    return filteredStudents;
  } catch (error) {
    console.error(`[OLevelTeacherSubjectService] Error getting students for subject:`, error);
    return [];
  }
}

/**
 * Get students who are assigned to a teacher for a specific subject in a class
 * This combines teacher assignment and student subject selection
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Array>} - Array of students
 */
async function getTeacherStudentsForSubject(teacherId, classId, subjectId) {
  console.log(`[OLevelTeacherSubjectService] Getting students for teacher ${teacherId} for subject ${subjectId} in class ${classId}`);

  try {
    // First, check if the teacher is assigned to this subject in this class
    const isAssigned = await isTeacherAssignedToSubject(teacherId, classId, subjectId);
    if (!isAssigned) {
      console.log(`[OLevelTeacherSubjectService] Teacher ${teacherId} is not assigned to subject ${subjectId} in class ${classId}`);
      return [];
    }

    // Get students who take this subject
    const students = await getStudentsForSubject(classId, subjectId);
    console.log(`[OLevelTeacherSubjectService] Found ${students.length} students who take subject ${subjectId} in class ${classId}`);

    return students;
  } catch (error) {
    console.error(`[OLevelTeacherSubjectService] Error getting teacher students for subject:`, error);
    return [];
  }
}

/**
 * Clear the cache
 */
function clearCache() {
  cache.teacherSubjects.clear();
  cache.lastUpdated.clear();
  console.log('[OLevelTeacherSubjectService] Cache cleared');
}

module.exports = {
  isTeacherAssignedToSubject,
  getTeacherSubjectsInClass,
  getStudentsForSubject,
  getTeacherStudentsForSubject,
  clearCache
};
