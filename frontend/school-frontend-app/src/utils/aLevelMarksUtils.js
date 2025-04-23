/**
 * A-Level Marks Utilities
 *
 * This file contains utility functions for A-Level marks entry and validation.
 */

import api from '../utils/api';
import newALevelResultService from '../services/newALevelResultService';
/**
 * Format A-Level student name
 * @param {Object} student - Student object
 * @returns {string} - Formatted student name
 */
export const formatALevelStudentName = (student) => {
  if (!student) return 'Unknown Student';

  // Handle different student name formats
  if (student.firstName && student.lastName) {
    return `${student.firstName} ${student.lastName}`;
  }

  if (student.name) {
    return student.name;
  }

  if (student.fullName) {
    return student.fullName;
  }

  if (typeof student === 'string') {
    return student;
  }

  return 'Unknown Student';
};

/**
 * Validate student eligibility for a subject
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Eligibility result
 */
export const validateStudentEligibility = async (studentId, subjectId) => {
  try {
    const response = await api.get('/api/prisma/marks/validate-eligibility', {
      params: {
        studentId,
        subjectId
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error validating student eligibility:', error);
    return {
      success: false,
      isEligible: false,
      message: 'Error validating eligibility'
    };
  }
};

/**
 * Batch validate student eligibility for a subject
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Batch eligibility results
 */
export const batchValidateEligibility = async (studentIds, subjectId) => {
  try {
    // Try the batch endpoint first
    try {
      const response = await api.post('/api/prisma/marks/batch-validate-eligibility', {
        studentIds,
        subjectId
      });

      return response.data;
    } catch (batchError) {
      console.warn('Batch eligibility endpoint not available, falling back to individual checks:', batchError.message);

      // If the batch endpoint fails, fall back to individual checks
      const results = {};

      // Check if we should use the legacy endpoint or the Prisma endpoint
      let useLegacyFallback = true;

      // Try the Prisma endpoint for a single student first
      try {
        if (studentIds.length > 0) {
          await api.get('/api/prisma/marks/validate-eligibility', {
            params: {
              studentId: studentIds[0],
              subjectId
            }
          });
          useLegacyFallback = false;
        }
      } catch (singleError) {
        console.warn('Prisma eligibility endpoint not available, using legacy fallback:', singleError.message);
      }

      // Process each student individually
      for (const studentId of studentIds) {
        try {
          let eligibilityResult;

          if (useLegacyFallback) {
            // Try to get the student's subjects from the legacy endpoint
            const studentResponse = await api.get(`/api/students/${studentId}`);
            const student = studentResponse.data;

            // Check if the student has this subject in their combination
            let hasSubject = false;

            // First check in student.subjects
            if (student.subjects && Array.isArray(student.subjects)) {
              hasSubject = student.subjects.some(s => {
                // Check for direct ID match
                if (s.subjectId === subjectId) return true;

                // Check for object ID match
                if (s.subject && s.subject._id === subjectId) return true;

                // Check for string ID match
                if (s.subject && s.subject.id === subjectId) return true;

                // Check for string comparison
                if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

                // Check for name match if we have subject details
                if (s.subject?.name && subjectId.includes(s.subject.name)) return true;

                return false;
              });
            }

            // If not found, check in student.subjectCombination
            if (!hasSubject && student.subjectCombination?.subjects) {
              hasSubject = student.subjectCombination.subjects.some(s => {
                // Check for direct ID match
                if (s.subjectId === subjectId) return true;

                // Check for object ID match
                if (s.subject && s.subject._id === subjectId) return true;

                // Check for string ID match
                if (s.subject && s.subject.id === subjectId) return true;

                // Check for string comparison
                if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

                return false;
              });
            }

            // If still not found, try to get the subject details and check by name
            if (!hasSubject) {
              try {
                const subjectResponse = await api.get(`/api/subjects/${subjectId}`);
                const subject = subjectResponse.data;

                if (subject?.name) {
                  // Check if any subject name in student's combination matches
                  if (student.subjects && Array.isArray(student.subjects)) {
                    hasSubject = student.subjects.some(s => {
                      if (s.subject?.name &&
                          (s.subject.name.includes(subject.name) || subject.name.includes(s.subject.name))) {
                        return true;
                      }
                      return false;
                    });
                  }
                }
              } catch (error) {
                console.warn(`Could not get subject details for ${subjectId}:`, error.message);
              }
            }

            // Get the subject details to check if it's principal
            let isPrincipal = false;

            // First check in student.subjects
            if (hasSubject && student.subjects && Array.isArray(student.subjects)) {
              const subjectEntry = student.subjects.find(s => {
                // Check for direct ID match
                if (s.subjectId === subjectId) return true;

                // Check for object ID match
                if (s.subject?._id === subjectId) return true;

                // Check for string ID match
                if (s.subject?.id === subjectId) return true;

                // Check for string comparison
                if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

                return false;
              });

              isPrincipal = subjectEntry?.isPrincipal || false;
            }

            // If not found, check in student.subjectCombination
            if (!isPrincipal && hasSubject && student.subjectCombination?.subjects) {
              const subjectEntry = student.subjectCombination.subjects.find(s => {
                // Check for direct ID match
                if (s.subjectId === subjectId) return true;

                // Check for object ID match
                if (s.subject?._id === subjectId) return true;

                // Check for string ID match
                if (s.subject?.id === subjectId) return true;

                // Check for string comparison
                if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

                return false;
              });

              isPrincipal = subjectEntry?.isPrincipal || false;
            }

            eligibilityResult = {
              isEligible: hasSubject,
              message: hasSubject ? 'Student is eligible for this subject' : 'Subject is not in student\'s combination',
              isPrincipal: isPrincipal
            };
          } else {
            // Use the Prisma endpoint
            const response = await api.get('/api/prisma/marks/validate-eligibility', {
              params: {
                studentId,
                subjectId
              }
            });

            eligibilityResult = response.data;
          }

          results[studentId] = {
            isEligible: eligibilityResult.isEligible,
            message: eligibilityResult.message,
            isPrincipal: eligibilityResult.isPrincipal,
            isSubsidiary: eligibilityResult.isSubsidiary
          };
        } catch (error) {
          console.error(`Error checking eligibility for student ${studentId}:`, error);
          results[studentId] = {
            isEligible: false,
            message: `Error checking eligibility: ${error.message}`
          };
        }
      }

      return {
        success: true,
        results
      };
    }
  } catch (error) {
    console.error('Error in batch validation fallback:', error);
    return {
      success: false,
      message: 'Error batch validating eligibility'
    };
  }
};

/**
 * Calculate grade and points from marks
 * @param {number|string} marks - Marks obtained (0-100)
 * @returns {Object} - Object containing grade and points
 */
export const calculateGradeAndPoints = (marks) => {
  if (marks === '' || marks === null || marks === undefined) {
    return { grade: '', points: '' };
  }

  const numMarks = Number(marks);
  if (Number.isNaN(numMarks)) {
    return { grade: '', points: '' };
  }

  const grade = newALevelResultService.calculateGrade(numMarks);
  const points = newALevelResultService.calculatePoints(grade);

  return { grade, points };
};

/**
 * Validate marks value
 * @param {string|number} value - Marks value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateMarks = (value) => {
  if (value === '') return true;

  const numValue = Number(value);
  return !Number.isNaN(numValue) && numValue >= 0 && numValue <= 100;
};

/**
 * Process student data for marks entry
 * @param {Object} student - Student object
 * @param {string} subjectId - Subject ID
 * @param {string} examId - Exam ID
 * @param {string} classId - Class ID
 * @param {Object} existingResult - Existing result object (if any)
 * @param {Object} eligibilityResult - Eligibility validation result
 * @param {Object} examDetails - Exam details
 * @returns {Object} - Processed mark data
 */
export const processStudentForMarksEntry = (
  student,
  subjectId,
  examId,
  classId,
  existingResult = null,
  eligibilityResult = null,
  examDetails = null
) => {
  // Determine if this is a principal subject
  let isPrincipal = false;

  // First check if it's in the eligibility result
  if (eligibilityResult && eligibilityResult.isPrincipal !== undefined) {
    isPrincipal = eligibilityResult.isPrincipal;
  }
  // Then check if it's already set on the student object
  else if (student.isPrincipal !== undefined) {
    isPrincipal = student.isPrincipal;
  }
  // Then check in student.subjects
  else if (student.subjects && Array.isArray(student.subjects)) {
    const subjectEntry = student.subjects.find(s =>
      s.subjectId === subjectId ||
      s.subjectId?.toString() === subjectId.toString()
    );
    if (subjectEntry) {
      isPrincipal = !!subjectEntry.isPrincipal;
    }
  }

  // Format student name properly
  const studentName = formatALevelStudentName(student);

  // Determine if student is eligible for this subject
  let isEligible = false;
  let isPrincipalSubject = isPrincipal;
  let eligibilityMessage = null;

  // First check from eligibility result
  if (eligibilityResult) {
    isEligible = eligibilityResult.isEligible;
    isPrincipalSubject = eligibilityResult.isPrincipal || isPrincipal;
    if (!isEligible) {
      eligibilityMessage = eligibilityResult.message;
    }
  }

  // Create mark data object
  const markData = {
    studentId: student._id,
    studentName: studentName,
    examId,
    subjectId,
    classId,
    marksObtained: existingResult ? existingResult.marksObtained : '',
    grade: existingResult ? existingResult.grade : '',
    points: existingResult ? existingResult.points : '',
    comment: existingResult ? existingResult.comment : '',
    isPrincipal: existingResult ? existingResult.isPrincipal : isPrincipalSubject,
    isInCombination: isEligible,
    eligibilityWarning: eligibilityMessage,
    _id: existingResult ? existingResult._id : null
  };

  // Add academicYearId and examTypeId if available
  if (examDetails?.academicYear) {
    markData.academicYearId = examDetails.academicYear;
  } else if (examDetails?.academicYearId) {
    markData.academicYearId = examDetails.academicYearId;
  }

  if (examDetails?.examType) {
    markData.examTypeId = examDetails.examType;
  } else if (examDetails?.examTypeId) {
    markData.examTypeId = examDetails.examTypeId;
  }

  return markData;
};

/**
 * Calculate grade distribution from marks data
 * @param {Array<Object>} marks - Array of mark objects
 * @returns {Object} - Grade distribution object
 */
export const calculateGradeDistribution = (marks) => {
  const grades = ['A', 'B', 'C', 'D', 'E', 'S', 'F'];
  const distribution = {};

  for (const grade of grades) {
    const count = marks.filter(mark => mark.grade === grade).length;
    const percentage = marks.length > 0 ? (count / marks.length) * 100 : 0;

    distribution[grade] = {
      count,
      percentage
    };
  }

  return distribution;
};

export default {
  validateStudentEligibility,
  batchValidateEligibility,
  calculateGradeAndPoints,
  validateMarks,
  processStudentForMarksEntry,
  calculateGradeDistribution
};
