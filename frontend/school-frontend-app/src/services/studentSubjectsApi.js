/**
 * Student Subjects API Service
 *
 * This service provides functions for fetching subjects for students,
 * especially for A-Level students with subject combinations.
 */
import api from '../utils/api';

/**
 * Get subjects for a specific student
 * @param {string} studentId - The student ID
 * @returns {Promise<Array>} - Array of subjects for the student
 */
const getStudentSubjects = async (studentId) => {
  try {
    if (!studentId) {
      console.warn('No student ID provided to getStudentSubjects');
      return [];
    }

    console.log(`Fetching subjects for student: ${studentId}`);

    // First, get the student details to check for subject combination
    const studentResponse = await api.get(`/api/students/${studentId}`);
    const student = studentResponse.data;

    if (student && student.subjectCombination) {
      console.log(`Student has subject combination: ${typeof student.subjectCombination === 'object' ?
        (student.subjectCombination.name || student.subjectCombination._id) : student.subjectCombination}`);

      // Check if the combination is fully populated
      const isPopulated = typeof student.subjectCombination === 'object' &&
                        student.subjectCombination.subjects &&
                        Array.isArray(student.subjectCombination.subjects);

      if (!isPopulated) {
        console.log('Subject combination is not fully populated, fetching details...');

        try {
          // Get the combination ID
          const combinationId = typeof student.subjectCombination === 'object' ?
            student.subjectCombination._id : student.subjectCombination;

          // Fetch the full combination details
          const combinationResponse = await api.get(`/api/subject-combinations/${combinationId}`);
          const fullCombination = combinationResponse.data;

          // Update the student's subject combination
          student.subjectCombination = fullCombination;
          console.log('Fetched full subject combination:', fullCombination);
        } catch (error) {
          console.error('Error fetching subject combination details:', error);
        }
      }

      // Get subjects from the student's combination
      const combinationSubjects = getSubjectsFromCombination(student);

      if (combinationSubjects.length > 0) {
        console.log(`Found ${combinationSubjects.length} subjects from student's combination`);
        return combinationSubjects;
      }
    }

    // If no combination or no subjects in combination, fetch from API
    console.log(`Fetching subjects directly from API for student: ${studentId}`);
    const response = await api.get(`/api/students/${studentId}/subjects`);

    // Log the subjects for debugging
    if (response.data && Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} subjects for student ${studentId}`);

      // Log principal and subsidiary subjects separately
      const principalSubjects = response.data.filter(subject =>
        subject.isPrincipal || subject.type === 'PRINCIPAL'
      );

      const subsidiarySubjects = response.data.filter(subject =>
        !subject.isPrincipal && subject.type !== 'PRINCIPAL'
      );

      console.log(`Principal subjects: ${principalSubjects.map(s => s.name).join(', ')}`);
      console.log(`Subsidiary subjects: ${subsidiarySubjects.map(s => s.name).join(', ')}`);
    }

    return response.data || [];
  } catch (error) {
    console.error(`Error fetching subjects for student ${studentId}:`, error);
    throw error;
  }
};

/**
 * Get subjects for a student from their subject combination
 * @param {Object} student - The student object with populated subjectCombination
 * @returns {Array} - Array of subjects from the student's combination
 */
const getSubjectsFromCombination = (student) => {
  if (!student) {
    console.warn('No student provided to getSubjectsFromCombination');
    return [];
  }

  // Check if student has a subject combination
  if (!student.subjectCombination) {
    console.warn(`Student ${student._id} has no subject combination`);
    return [];
  }

  const combination = student.subjectCombination;
  const subjects = [];

  // Log combination details for debugging
  console.log('Processing subject combination:', {
    combinationId: combination._id || 'Unknown ID',
    combinationName: combination.name || 'Unknown Name',
    combinationCode: combination.code || 'Unknown Code',
    hasPrincipalSubjects: !!(combination.subjects && Array.isArray(combination.subjects) && combination.subjects.length > 0),
    hasSubsidiarySubjects: !!(combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects) && combination.compulsorySubjects.length > 0)
  });

  // Add principal subjects
  if (combination.subjects && Array.isArray(combination.subjects)) {
    console.log(`Found ${combination.subjects.length} principal subjects in combination`);
    for (const subject of combination.subjects) {
      // Check if subject is a valid object
      if (!subject || typeof subject !== 'object') {
        console.warn('Invalid principal subject in combination:', subject);
        continue;
      }

      // Add isPrincipal flag if not already present
      const subjectWithFlag = {
        ...subject,
        isPrincipal: true
      };
      subjects.push(subjectWithFlag);
    }
  } else {
    console.warn('No principal subjects found in combination or subjects is not an array');
  }

  // Add subsidiary/compulsory subjects
  if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
    console.log(`Found ${combination.compulsorySubjects.length} subsidiary subjects in combination`);
    for (const subject of combination.compulsorySubjects) {
      // Check if subject is a valid object
      if (!subject || typeof subject !== 'object') {
        console.warn('Invalid subsidiary subject in combination:', subject);
        continue;
      }

      // Add isPrincipal flag if not already present
      const subjectWithFlag = {
        ...subject,
        isPrincipal: false
      };
      subjects.push(subjectWithFlag);
    }
  } else {
    console.warn('No subsidiary subjects found in combination or compulsorySubjects is not an array');
  }

  // Log the subjects for debugging
  if (subjects.length > 0) {
    console.log(`Found ${subjects.length} subjects from combination for student ${student._id}`);

    // Log principal and subsidiary subjects separately
    const principalSubjects = subjects.filter(subject => subject.isPrincipal);
    const subsidiarySubjects = subjects.filter(subject => !subject.isPrincipal);

    console.log(`Principal subjects: ${principalSubjects.map(s => s.name).join(', ')}`);
    console.log(`Subsidiary subjects: ${subsidiarySubjects.map(s => s.name).join(', ')}`);
  }

  return subjects;
};

/**
 * Check if a subject is in a student's combination
 * @param {string} subjectId - The subject ID
 * @param {Object} student - The student object with populated subjectCombination
 * @returns {boolean} - True if the subject is in the student's combination
 */
const isSubjectInStudentCombination = (subjectId, student) => {
  if (!subjectId || !student) {
    return false;
  }

  // Check if student has a subject combination
  if (!student.subjectCombination) {
    console.warn(`Student ${student._id} has no subject combination when checking for subject ${subjectId}`);
    return false;
  }

  // If the combination is not populated (just an ID), we can't check
  if (typeof student.subjectCombination === 'string' ||
      (student.subjectCombination._id && !student.subjectCombination.subjects)) {
    console.warn(`Student ${student._id} has an unpopulated subject combination: ${typeof student.subjectCombination === 'string' ? student.subjectCombination : student.subjectCombination._id}`);
    // We'll return false here, but in a real implementation you might want to
    // fetch the combination details first
    return false;
  }

  // Get subjects from combination
  const subjects = getSubjectsFromCombination(student);

  // Check if subject is in the list
  const isInCombination = subjects.some(subject => subject._id === subjectId);
  console.log(`Subject ${subjectId} is ${isInCombination ? '' : 'not '}in student's combination`);
  return isInCombination;
};

export default {
  getStudentSubjects,
  getSubjectsFromCombination,
  isSubjectInStudentCombination
};
