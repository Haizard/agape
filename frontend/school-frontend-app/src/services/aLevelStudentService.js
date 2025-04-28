/**
 * A-Level Student Service
 *
 * This service provides functions to interact with A-Level student data.
 */

import api from '../utils/api';

/**
 * Get A-Level students filtered by subject for a class
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Result with filtered students
 */
export const getStudentsFilteredBySubject = async (classId, subjectId) => {
  if (!classId) {
    console.error('Missing required parameter: classId');
    return {
      success: false,
      message: 'Class ID is required'
    };
  }

  if (!subjectId) {
    console.error('Missing required parameter: subjectId');
    return {
      success: false,
      message: 'Subject ID is required'
    };
  }

  try {
    // Use the correct API endpoint with /api prefix
    const response = await api.get('/api/new-a-level/students-by-class-and-subject', {
      params: {
        classId,
        subjectId
      }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error fetching students by class and subject:', error);
    return {
      success: false,
      message: 'Failed to fetch students by class and subject',
      error
    };
  }
};

/**
 * Format student data for marks entry
 * @param {Array<Object>} students - Array of student objects
 * @param {string} subjectId - Subject ID
 * @param {string} examId - Exam ID
 * @param {string} classId - Class ID
 * @param {Object} examDetails - Exam details
 * @returns {Promise<Array<Object>>} - Formatted marks data
 */
export const formatStudentsForMarksEntry = async (students, subjectId, examId, classId, examDetails) => {
  try {
    // Check if we have students
    if (!students || !Array.isArray(students) || students.length === 0) {
      return [];
    }

    // Get existing results for these students
    const marksData = [];

    for (const student of students) {
      // Skip if student is undefined or null
      if (!student) {
        console.warn('Skipping undefined or null student');
        continue;
      }

      // Debug: Log student subject combinations
      console.log('Student:', student._id || student.id, 'Possible subject fields:', student.subjects, student.subjectCombinations, student.combination, student.subjectCombination);

      // Determine if student takes the subject and if it is principal or subsidiary
      let takesSubject = false;
      let isPrincipalSubject = false;
      let eligibilityMessage = '';
      // Check various possible fields for subject combinations
      if (student.subjectCombination && Array.isArray(student.subjectCombination.subjects)) {
        // Check principal subjects
        takesSubject = student.subjectCombination.subjects.some(s => {
          const match = (typeof s === 'string' ? s : s._id || s.subjectId) === subjectId;
          if (match && (typeof s === 'object' && s.isPrincipal)) {
            isPrincipalSubject = true;
          }
          return match;
        });
        // Check compulsory (subsidiary) subjects if not found in principal
        if (!takesSubject && Array.isArray(student.subjectCombination.compulsorySubjects)) {
          takesSubject = student.subjectCombination.compulsorySubjects.some(s => {
            const match = (typeof s === 'string' ? s : s._id || s.subjectId) === subjectId;
            if (match) {
              isPrincipalSubject = false;
            }
            return match;
          });
        }
        eligibilityMessage = 'Checked student.subjectCombination.subjects and compulsorySubjects';
      } else if (Array.isArray(student.subjects)) {
        takesSubject = student.subjects.some(s => (typeof s === 'string' ? s : s._id || s.subjectId) === subjectId);
        eligibilityMessage = 'Checked student.subjects';
      } else if (Array.isArray(student.subjectCombinations)) {
        takesSubject = student.subjectCombinations.some(comb =>
          Array.isArray(comb.subjects) && comb.subjects.some(s => (typeof s === 'string' ? s : s._id || s.subjectId) === subjectId)
        );
        eligibilityMessage = 'Checked student.subjectCombinations';
      } else if (student.combination && Array.isArray(student.combination.subjects)) {
        takesSubject = student.combination.subjects.some(s => (typeof s === 'string' ? s : s._id || s.subjectId) === subjectId);
        eligibilityMessage = 'Checked student.combination.subjects';
      } else {
        eligibilityMessage = 'No subject combination found';
      }

      try {
        // Check if marks already exist for this student
        let existingResult = null;
        // Format student ID properly - handle both _id and id formats
        const studentId = student.id || student._id || `unknown-${Math.random().toString(36).substring(7)}`;

        try {
          const resultsResponse = await api.get(`/api/new-a-level/results/student/${studentId}/exam/${examId}`);
          if (resultsResponse.data?.results) {
            // Log the full API response for debugging
            console.log('API response for student:', studentId, resultsResponse.data);
            existingResult = resultsResponse.data.results.find(result => {
              if (!result.subjectId) return false;
              // Log both the selected subjectId and the backend result subjectId for debugging
              console.log('[DEBUG] Comparing subjectIds:', {
                selectedSubjectId: subjectId,
                backendSubjectId: result.subjectId,
                backendSubjectId_id: result.subjectId._id,
                backendSubjectId_idString: result.subjectId._id ? result.subjectId._id.toString() : undefined
              });
              // If subjectId is an object with _id
              if (typeof result.subjectId === 'object' && result.subjectId._id) {
                return result.subjectId._id === subjectId || result.subjectId._id.toString() === subjectId.toString();
              }
              // If subjectId is an object with id
              if (typeof result.subjectId === 'object' && result.subjectId.id) {
                return result.subjectId.id === subjectId || result.subjectId.id.toString() === subjectId.toString();
              }
              // If subjectId is a string
              return result.subjectId === subjectId || result.subjectId.toString() === subjectId.toString();
            });
            // Log the mapping for debugging
            console.log('Student:', studentId, 'Existing result:', existingResult);
          }
        } catch (err) {
          console.log(`No existing result for student ${studentId}:`, err.message);
        }

        // Format student name properly
        const studentName = student.name ||
          (student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` :
          (student.firstName || student.lastName || 'Unknown Student'));

        // Add student to marks data
        const markData = {
          studentId: studentId,
          studentName: studentName,
          examId: examId,
          subjectId: subjectId,
          classId: classId,
          marksObtained: existingResult ? existingResult.marksObtained : '',
          grade: existingResult ? existingResult.grade : '',
          points: existingResult ? existingResult.points : '',
          comment: existingResult ? existingResult.comment : '',
          isPrincipal: existingResult ? existingResult.isPrincipal : isPrincipalSubject,
          isInCombination: takesSubject,
          eligibilityWarning: eligibilityMessage,
          _id: existingResult ? existingResult._id : null,
          // Debug: add backend subjectId for UI
          _backendSubjectId: existingResult?.subjectId?._id ? existingResult.subjectId._id : (typeof existingResult?.subjectId === 'string' ? existingResult.subjectId : undefined)
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

        marksData.push(markData);
      } catch (err) {
        // Get student ID safely
        const errorStudentId = student?.id || student?._id || 'unknown';
        console.error(`Error processing student ${errorStudentId}:`, err);
      }
    }

    return marksData;
  } catch (error) {
    console.error('Error formatting students for marks entry:', error);
    return [];
  }
};

export default {
  getStudentsFilteredBySubject,
  formatStudentsForMarksEntry
};
