/**
 * Utility functions for student filtering and management
 */

/**
 * Filters students based on subject selection
 * @param {Array} students - Array of student objects
 * @param {string} subjectId - ID of the subject to filter by
 * @param {boolean} isCore - Whether the subject is a core subject
 * @param {Object} selectionMap - Map of student IDs to their selected subjects
 * @returns {Array} Filtered array of students
 */
export const filterStudentsBySubject = (students, subjectId, isCore, selectionMap) => {
  // If it's a core subject, all students take it
  if (isCore) {
    return students;
  }
  
  // For optional subjects, only include students who have selected it
  const filteredStudents = students.filter(student => {
    const studentId = student._id;
    const studentSubjects = selectionMap[studentId] || [];
    return studentSubjects.includes(subjectId);
  });
  
  return filteredStudents;
};

/**
 * Creates a map of student IDs to their selected subjects
 * @param {Array} selections - Array of student subject selection objects
 * @returns {Object} Map of student IDs to arrays of subject IDs
 */
export const createStudentSubjectsMap = (selections) => {
  const studentSubjectsMap = {};
  
  if (!selections || !Array.isArray(selections)) {
    return studentSubjectsMap;
  }
  
  selections.forEach(selection => {
    if (selection.student) {
      const studentId = typeof selection.student === 'object' ? selection.student._id : selection.student;
      
      // Combine core and optional subjects
      const allSubjects = [
        ...(selection.coreSubjects || []).map(s => typeof s === 'object' ? s._id : s),
        ...(selection.optionalSubjects || []).map(s => typeof s === 'object' ? s._id : s)
      ];
      
      studentSubjectsMap[studentId] = allSubjects;
    }
  });
  
  return studentSubjectsMap;
};

/**
 * Checks if a subject is a core subject
 * @param {Object} subject - Subject object
 * @returns {boolean} Whether the subject is a core subject
 */
export const isSubjectCore = (subject) => {
  return subject && subject.type === 'CORE';
};

/**
 * Formats a student's name consistently
 * @param {Object} student - Student object
 * @returns {string} Formatted student name
 */
export const formatStudentName = (student) => {
  if (!student) return 'Unknown Student';
  
  if (student.name) {
    return student.name;
  } else if (student.studentName) {
    return student.studentName;
  } else if (student.firstName || student.lastName) {
    return `${student.firstName || ''} ${student.lastName || ''}`.trim();
  } else {
    return `Student ${student._id}`;
  }
};

export default {
  filterStudentsBySubject,
  createStudentSubjectsMap,
  isSubjectCore,
  formatStudentName
};
