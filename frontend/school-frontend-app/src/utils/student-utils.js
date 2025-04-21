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
    console.log('Subject is core, returning all students:', students.length);
    return students;
  }

  // Convert subjectId to string for comparison
  const subjectIdStr = subjectId?.toString();
  console.log(`Filtering students for optional subject ${subjectIdStr}`);

  // Check if we have any selections
  if (!selectionMap || Object.keys(selectionMap).length === 0) {
    console.log('No student subject selections found, returning all students as fallback');
    return students;
  }

  // Log the selection map for debugging
  console.log('Selection map keys:', Object.keys(selectionMap));
  console.log('Selection map entries sample:',
    Object.entries(selectionMap).slice(0, 3).map(([id, subjects]) =>
      `Student ${id}: ${subjects.length} subjects`
    )
  );

  // For optional subjects, only include students who have selected it
  const filteredStudents = students.filter(student => {
    // Safely convert student ID to string
    let studentId;

    // Handle different student ID formats
    if (student._id) {
      studentId = typeof student._id === 'object' ? student._id.toString() : student._id.toString();
    } else if (student.id) {
      studentId = student.id.toString();
    } else {
      console.log('Student has no ID, skipping:', student);
      return false;
    }

    // Get student name for logging
    const studentName = student.name ||
                       (student.firstName && student.lastName ?
                        `${student.firstName} ${student.lastName}` :
                        'Unknown');

    // Check if student has selected subjects in the selection map
    const studentSubjects = selectionMap[studentId] || [];
    console.log(`Student ${studentId} (${studentName}) has ${studentSubjects.length} subjects in selection map`);

    // If no subjects found in selection map, check if this is a data format issue
    if (studentSubjects.length === 0) {
      // Try to find the student ID in the selection map using different formats
      const alternativeIds = Object.keys(selectionMap).filter(key => {
        // Check if the key contains the student ID as a substring
        return key.includes(studentId) || studentId.includes(key);
      });

      if (alternativeIds.length > 0) {
        console.log(`Found alternative IDs for student ${studentId}:`, alternativeIds);
        // Use the first alternative ID
        const altStudentSubjects = selectionMap[alternativeIds[0]] || [];
        if (altStudentSubjects.length > 0) {
          console.log(`Using alternative ID ${alternativeIds[0]} with ${altStudentSubjects.length} subjects`);
          // Check if the subject is in these alternative subjects
          const altStudentSubjectIds = altStudentSubjects.map(s => {
            if (!s) return null;
            if (typeof s === 'object' && s._id) return s._id.toString();
            return s.toString();
          }).filter(Boolean);

          const hasSubject = altStudentSubjectIds.includes(subjectIdStr);
          if (hasSubject) {
            console.log(`MATCH via alternative ID: Student ${studentId} (${studentName}) takes subject ${subjectIdStr}`);
            return true;
          }
        }
      }
    }

    // Check if the subject is in the student's selected subjects
    let hasSubject = false;
    if (studentSubjects.length > 0) {
      // Convert all subject IDs to strings for comparison
      const studentSubjectIds = studentSubjects.map(s => {
        if (!s) return null;
        if (typeof s === 'object' && s._id) return s._id.toString();
        return s.toString();
      }).filter(Boolean);

      hasSubject = studentSubjectIds.includes(subjectIdStr);
      console.log(`Student ${studentId} subject IDs:`, studentSubjectIds);
      console.log(`Subject ${subjectIdStr} found in selection map: ${hasSubject}`);
    }

    // Also check student.selectedSubjects if available
    let hasSubjectInModel = false;
    if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
      const selectedSubjects = student.selectedSubjects.map(s =>
        typeof s === 'object' && s._id ? s._id.toString() : s?.toString()).filter(Boolean);
      hasSubjectInModel = selectedSubjects.includes(subjectIdStr);
      console.log(`Student ${studentId} has subject in model: ${hasSubjectInModel}`);
    }

    // Also check student.optionalSubjects if available (another possible format)
    let hasSubjectInOptional = false;
    if (student.optionalSubjects && Array.isArray(student.optionalSubjects)) {
      const optionalSubjects = student.optionalSubjects.map(s =>
        typeof s === 'object' && s._id ? s._id.toString() : s?.toString()).filter(Boolean);
      hasSubjectInOptional = optionalSubjects.includes(subjectIdStr);
      console.log(`Student ${studentId} has subject in optionalSubjects: ${hasSubjectInOptional}`);
    }

    const result = hasSubject || hasSubjectInModel || hasSubjectInOptional;
    if (result) {
      console.log(`MATCH: Student ${studentId} (${studentName}) takes subject ${subjectIdStr}`);
    } else {
      console.log(`NO MATCH: Student ${studentId} (${studentName}) does not take subject ${subjectIdStr}`);
    }

    return result;
  });

  console.log(`Filtered from ${students.length} to ${filteredStudents.length} students for optional subject ${subjectIdStr}`);

  // If no students were found after filtering, return all students as a fallback
  if (filteredStudents.length === 0) {
    console.log('No students found after filtering, returning all students as fallback');
    return students;
  }

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
    console.log('No selections provided or selections is not an array');
    return studentSubjectsMap;
  }

  console.log(`Processing ${selections.length} student subject selections`);

  // Log the first selection to understand its structure
  if (selections.length > 0) {
    console.log('First selection structure:', JSON.stringify(selections[0], null, 2));
  }

  // Helper function to safely convert IDs to strings
  const safeToString = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && value._id) return value._id.toString();
    if (typeof value === 'string') return value;
    try {
      return value.toString();
    } catch (e) {
      console.error('Error converting value to string:', e, value);
      return null;
    }
  };

  // Process each selection
  selections.forEach((selection, index) => {
    console.log(`Processing selection ${index + 1}/${selections.length}`);

    // Extract student ID - handle different possible formats
    let studentId = null;

    // Try to get student ID from selection.student
    if (selection.student) {
      if (typeof selection.student === 'object' && selection.student._id) {
        studentId = selection.student._id.toString();
        console.log(`Student ID extracted from object: ${studentId}`);
      } else if (typeof selection.student === 'string') {
        studentId = selection.student;
        console.log(`Student ID is already a string: ${studentId}`);
      } else {
        try {
          studentId = selection.student.toString();
          console.log(`Student ID converted to string: ${studentId}`);
        } catch (e) {
          console.error('Error converting student ID to string:', e);
        }
      }
    }

    // If student ID not found in selection.student, try selection.studentId
    if (!studentId && selection.studentId) {
      if (typeof selection.studentId === 'object' && selection.studentId._id) {
        studentId = selection.studentId._id.toString();
        console.log(`Student ID extracted from studentId object: ${studentId}`);
      } else if (typeof selection.studentId === 'string') {
        studentId = selection.studentId;
        console.log(`Student ID from studentId is already a string: ${studentId}`);
      } else {
        try {
          studentId = selection.studentId.toString();
          console.log(`Student ID from studentId converted to string: ${studentId}`);
        } catch (e) {
          console.error('Error converting studentId to string:', e);
        }
      }
    }

    // If still no student ID, try selection._id
    if (!studentId && selection._id) {
      if (typeof selection._id === 'object' && selection._id._id) {
        studentId = selection._id._id.toString();
        console.log(`Student ID extracted from _id object: ${studentId}`);
      } else if (typeof selection._id === 'string') {
        studentId = selection._id;
        console.log(`Student ID from _id is already a string: ${studentId}`);
      } else {
        try {
          studentId = selection._id.toString();
          console.log(`Student ID from _id converted to string: ${studentId}`);
        } catch (e) {
          console.error('Error converting _id to string:', e);
        }
      }
    }

    // If still no student ID, skip this selection
    if (!studentId) {
      console.log('Invalid student ID in selection, skipping:', selection);
      return;
    }

    // Process core subjects
    const coreSubjects = [];
    if (selection.coreSubjects && Array.isArray(selection.coreSubjects)) {
      console.log(`Processing ${selection.coreSubjects.length} core subjects for student ${studentId}`);
      selection.coreSubjects.forEach((subject, i) => {
        const subjectId = safeToString(subject);
        if (subjectId) {
          coreSubjects.push(subjectId);
          console.log(`Added core subject ${i+1}: ${subjectId}`);
        } else {
          console.log(`Invalid core subject at index ${i}:`, subject);
        }
      });
    } else {
      console.log(`No core subjects found for student ${studentId}`);
    }

    // Process optional subjects
    const optionalSubjects = [];
    if (selection.optionalSubjects && Array.isArray(selection.optionalSubjects)) {
      console.log(`Processing ${selection.optionalSubjects.length} optional subjects for student ${studentId}`);
      selection.optionalSubjects.forEach((subject, i) => {
        const subjectId = safeToString(subject);
        if (subjectId) {
          optionalSubjects.push(subjectId);
          console.log(`Added optional subject ${i+1} for student ${studentId}: ${subjectId}`);
        } else {
          console.log(`Invalid optional subject at index ${i}:`, subject);
        }
      });
    } else {
      console.log(`No optional subjects found for student ${studentId}`);
    }

    // Also check for subjects in selection.subjects (another possible format)
    const otherSubjects = [];
    if (selection.subjects && Array.isArray(selection.subjects)) {
      console.log(`Processing ${selection.subjects.length} subjects from 'subjects' field for student ${studentId}`);
      selection.subjects.forEach((subject, i) => {
        const subjectId = safeToString(subject);
        if (subjectId) {
          otherSubjects.push(subjectId);
          console.log(`Added subject from 'subjects' field ${i+1}: ${subjectId}`);
        } else {
          console.log(`Invalid subject from 'subjects' field at index ${i}:`, subject);
        }
      });
    }

    // Combine all subjects
    const allSubjects = [...coreSubjects, ...optionalSubjects, ...otherSubjects];

    // Log for debugging
    console.log(`Student ${studentId} has ${allSubjects.length} subjects (${coreSubjects.length} core, ${optionalSubjects.length} optional, ${otherSubjects.length} other)`);
    console.log(`All subjects for student ${studentId}:`, allSubjects);

    // Add to the map
    studentSubjectsMap[studentId] = allSubjects;
  });

  // Log the number of students in the map
  const studentCount = Object.keys(studentSubjectsMap).length;
  console.log(`Created subject map for ${studentCount} students`);

  // Log a sample of the map
  const sampleEntries = Object.entries(studentSubjectsMap).slice(0, 3);
  if (sampleEntries.length > 0) {
    console.log('Sample entries from student subjects map:');
    sampleEntries.forEach(([studentId, subjects]) => {
      console.log(`Student ${studentId}: ${subjects.length} subjects -`, subjects);
    });
  }

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
