/**
 * O-Level specific utility functions for student filtering and management
 * This file is separate from student-utils.js to provide O-Level specific functionality
 */

/**
 * Formats an O-Level student's name consistently
 * @param {Object} student - Student object
 * @returns {string} Formatted student name
 */
export const formatOLevelStudentName = (student) => {
  if (!student) return 'Unknown Student';

  // Debug the student object structure
  const studentKeys = Object.keys(student);
  console.log(`O-Level student object keys: ${studentKeys.join(', ')}`);

  // Check if we already have a formatted name
  if (student.name) {
    console.log(`Using student.name: ${student.name}`);
    return student.name;
  } else if (student.fullName) {
    console.log(`Using student.fullName: ${student.fullName}`);
    return student.fullName;
  } else if (student.studentName) {
    console.log(`Using student.studentName: ${student.studentName}`);
    return student.studentName;
  }

  // Check if we have firstName and lastName
  if (student.firstName || student.lastName) {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    console.log(`Using firstName/lastName: ${fullName}`);
    return fullName;
  }

  // Check if we have a student property with name fields
  if (student.student) {
    if (student.student.name) {
      console.log(`Using student.student.name: ${student.student.name}`);
      return student.student.name;
    } else if (student.student.fullName) {
      console.log(`Using student.student.fullName: ${student.student.fullName}`);
      return student.student.fullName;
    } else if (student.student.firstName || student.student.lastName) {
      const fullName = `${student.student.firstName || ''} ${student.student.lastName || ''}`.trim();
      console.log(`Using student.student firstName/lastName: ${fullName}`);
      return fullName;
    }
  }

  // Check if we have studentDetails
  if (student.studentDetails) {
    if (student.studentDetails.name) {
      console.log(`Using studentDetails.name: ${student.studentDetails.name}`);
      return student.studentDetails.name;
    } else if (student.studentDetails.fullName) {
      console.log(`Using studentDetails.fullName: ${student.studentDetails.fullName}`);
      return student.studentDetails.fullName;
    }
  }

  // If we get here, we don't have a proper name, so use the ID
  // Check if the ID is already in the format "Student ID"
  if (typeof student._id === 'string' && student._id.startsWith('Student ')) {
    console.log(`Using existing Student ID format: ${student._id}`);
    return student._id;
  }

  // Otherwise, format the ID as "Student ID"
  console.log(`Falling back to Student ID: ${student._id}`);
  return `Student ${student._id}`;
};

/**
 * Debug function to log student data structure
 * @param {Object} student - Student object
 */
export const debugStudentData = (student) => {
  if (!student) {
    console.log('Student is null or undefined');
    return;
  }

  console.log('O-Level Student Data Debug:');
  console.log('- ID:', student._id);
  console.log('- Name:', formatOLevelStudentName(student));
  console.log('- Name fields:', {
    name: student.name,
    fullName: student.fullName,
    studentName: student.studentName,
    firstName: student.firstName,
    lastName: student.lastName
  });
  
  if (student.student) {
    console.log('- Student sub-object:', {
      name: student.student.name,
      fullName: student.student.fullName,
      firstName: student.student.firstName,
      lastName: student.student.lastName
    });
  }
  
  if (student.studentDetails) {
    console.log('- StudentDetails sub-object:', {
      name: student.studentDetails.name,
      fullName: student.studentDetails.fullName
    });
  }
};

/**
 * Identifies which O-Level students take a specific subject
 * @param {Array} students - Array of student objects
 * @param {string} subjectId - ID of the subject to filter by
 * @param {boolean} isCore - Whether the subject is a core subject
 * @returns {Array} ALL students with an additional property 'takesSubject' indicating if they take the subject
 */
export const filterOLevelStudentsBySubject = (students, subjectId, isCore) => {
  console.log(`O-Level: Filtering students for subject ${subjectId}, isCore=${isCore}`);
  
  if (!students || !Array.isArray(students) || students.length === 0) {
    console.log('No students provided for filtering');
    return [];
  }

  if (!subjectId) {
    console.log('No subject ID provided for filtering');
    return students.map(student => ({ ...student, takesSubject: false }));
  }

  // If it's a core subject, all students take it
  if (isCore) {
    console.log('Subject is core, all students take it');
    return students.map(student => ({ ...student, takesSubject: true }));
  }

  // For optional subjects, check subject selections
  return students.map(student => {
    // Check if student has subject selections
    const hasSubjectSelections = student.subjectSelections && 
                               Array.isArray(student.subjectSelections) && 
                               student.subjectSelections.length > 0;
    
    // Check if student takes this subject
    const takesSubject = hasSubjectSelections && 
                       student.subjectSelections.some(selection => 
                         selection.subject && 
                         (selection.subject._id === subjectId || selection.subject.toString() === subjectId));
    
    console.log(`Student ${formatOLevelStudentName(student)} ${takesSubject ? 'takes' : 'does not take'} subject ${subjectId}`);
    
    return { ...student, takesSubject };
  });
};

export default {
  formatOLevelStudentName,
  debugStudentData,
  filterOLevelStudentsBySubject
};
