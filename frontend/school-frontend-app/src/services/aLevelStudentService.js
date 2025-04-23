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
 * @param {boolean} includeIneligible - Whether to include students who don't take the subject
 * @returns {Promise<Object>} - Result with filtered students
 */
export const getStudentsFilteredBySubject = async (classId, subjectId, includeIneligible = false) => {
  try {
    // First try the Prisma endpoint
    try {
      const response = await api.get('/api/prisma/subject-assignments/students-by-subject', {
        params: {
          classId,
          subjectId,
          includeIneligible
        }
      });

      // Check if the teacher is authorized to access this subject-class combination
      if (!response.data.success && response.data.data && response.data.data.authorized === false) {
        console.error('Teacher is not authorized to access this subject in this class');
        return {
          success: false,
          message: 'You are not authorized to access this subject in this class. Please contact an administrator.'
        };
      }

      return response.data;
    } catch (prismaError) {
      console.warn('Prisma endpoint failed, falling back to legacy approach:', prismaError.message);

      // If the Prisma endpoint fails with a "Frontend build not found" error, use the legacy approach
      if (prismaError.response?.data?.message === 'Frontend build not found') {
        console.log('Using legacy approach to get students and filter them client-side');

        // Get all students for the class
        const studentsResponse = await api.get(`/api/students?classId=${classId}`);

        // Filter for A-Level students
        const aLevelStudents = studentsResponse.data.filter(student => {
          return student.level === 'A' || student.educationLevel === 'A_LEVEL' || student.educationLevel === 'A';
        });

        // Get subject details
        const subjectResponse = await api.get(`/api/subjects/${subjectId}`);
        const subject = subjectResponse.data;

        // Get the subject code for more accurate matching
        let subjectCode = '';
        try {
          if (subject.code) {
            subjectCode = subject.code.toLowerCase();
          }
        } catch (err) {
          console.warn('Could not get subject code:', err);
        }

        // Process students to determine eligibility
        const processedStudents = aLevelStudents.map(student => {
          // Check if student has this subject in their combination
          let isEligible = false;
          let isPrincipal = false;

          // Check in student.subjects
          if (student.subjects && Array.isArray(student.subjects)) {
            // First try exact ID match
            const subjectEntry = student.subjects.find(s => {
              // Direct ID match
              if (s.subjectId === subjectId) return true;

              // Object ID match
              if (s.subject && s.subject._id === subjectId) return true;

              // String ID match
              if (s.subject && s.subject.id === subjectId) return true;

              // String comparison
              if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

              // String comparison with _id
              if (s.subjectId?._id?.toString() === subjectId.toString()) return true;

              // Code match if we have subject code
              if (subjectCode && s.subject && s.subject.code &&
                  s.subject.code.toLowerCase() === subjectCode) {
                return true;
              }

              // Name match if we have subject name
              if (subject.name && s.subject && s.subject.name &&
                  s.subject.name.toLowerCase() === subject.name.toLowerCase()) {
                return true;
              }

              return false;
            });

            if (subjectEntry) {
              isEligible = true;
              isPrincipal = subjectEntry.isPrincipal || false;
            }
          }

          // Check in student.subjectCombination
          if (!isEligible && student.subjectCombination && student.subjectCombination.subjects) {
            const combinationSubject = student.subjectCombination.subjects.find(s => {
              // Direct ID match
              if (s.subjectId === subjectId) return true;

              // Object ID match
              if (s.subject && s.subject._id === subjectId) return true;

              // String ID match
              if (s.subject && s.subject.id === subjectId) return true;

              // String comparison
              if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

              // String comparison with _id
              if (s.subjectId?._id?.toString() === subjectId.toString()) return true;

              // Code match if we have subject code
              if (subjectCode && s.subject && s.subject.code &&
                  s.subject.code.toLowerCase() === subjectCode) {
                return true;
              }

              // Name match if we have subject name
              if (subject.name && s.subject && s.subject.name &&
                  s.subject.name.toLowerCase() === subject.name.toLowerCase()) {
                return true;
              }

              return false;
            });

            if (combinationSubject) {
              isEligible = true;
              isPrincipal = combinationSubject.isPrincipal || false;
            }
          }

          // Check in student.combination (another format sometimes used)
          if (!isEligible && student.combination) {
            // If combination is a string ID, check if it matches a combination that includes this subject
            if (typeof student.combination === 'string') {
              // We can't check directly, but we'll mark as potentially eligible
              // and let the teacher decide
              isEligible = true;
            }
            // If combination is an object with subjects
            else if (student.combination.subjects && Array.isArray(student.combination.subjects)) {
              const combinationSubject = student.combination.subjects.find(s => {
                // Direct ID match
                if (s.subjectId === subjectId) return true;

                // Object ID match
                if (s.subject && s.subject._id === subjectId) return true;

                // String ID match
                if (s.subject && s.subject.id === subjectId) return true;

                // String comparison
                if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

                // String comparison with _id
                if (s.subjectId?._id?.toString() === subjectId.toString()) return true;

                // Name match if we have subject name
                if (subject.name && s.subject && s.subject.name &&
                    s.subject.name.toLowerCase() === subject.name.toLowerCase()) {
                  return true;
                }

                // Code match if we have subject code
                if (subjectCode && s.subject && s.subject.code &&
                    s.subject.code.toLowerCase() === subjectCode) {
                  return true;
                }

                return false;
              });

              if (combinationSubject) {
                isEligible = true;
                isPrincipal = combinationSubject.isPrincipal || false;
              }
            }
          }

          // Check in student.subjectSelections (another format sometimes used)
          if (!isEligible && student.subjectSelections && Array.isArray(student.subjectSelections)) {
            const selection = student.subjectSelections.find(s => {
              // Direct ID match
              if (s.subjectId === subjectId) return true;

              // Object ID match
              if (s.subject && s.subject._id === subjectId) return true;

              // String ID match
              if (s.subject && s.subject.id === subjectId) return true;

              // String comparison
              if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

              return false;
            });

            if (selection) {
              isEligible = true;
              isPrincipal = selection.isPrincipal || false;
            }
          }

          // Last resort: check if the student has a subject with a matching name
          if (!isEligible && subject.name) {
            const subjectName = subject.name.toLowerCase();

            // Check all possible subject arrays
            const allSubjects = [
              ...(student.subjects || []),
              ...(student.subjectCombination?.subjects || []),
              ...(student.combination?.subjects || []),
              ...(student.subjectSelections || [])
            ];

            // Look for a subject with a matching name
            const matchByName = allSubjects.some(s => {
              if (s.subject?.name?.toLowerCase() === subjectName) {
                return true;
              }
              return false;
            });

            if (matchByName) {
              isEligible = true;
            }
          }

          // Format student name
          const studentName = student.firstName && student.lastName
            ? `${student.firstName} ${student.lastName}`
            : student.name || 'Unknown Student';

          // Format student ID properly - handle both _id and id formats
          const studentId = student.id || student._id;

          // Last resort: Check if the student has any subjects at all
          // If not, we'll assume they're eligible for all subjects
          if (!isEligible &&
              (!student.subjects || student.subjects.length === 0) &&
              (!student.subjectCombination || !student.subjectCombination.subjects || student.subjectCombination.subjects.length === 0) &&
              (!student.combination || !student.combination.subjects || student.combination.subjects.length === 0)) {
            isEligible = true;
            console.log(`Student ${studentName} has no subjects, assuming eligible for all subjects`);
          }

          // We no longer need to mark students as assignable, as we've removed that functionality

          return {
            id: studentId,
            studentId: studentId,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            name: studentName,
            isEligible,
            isPrincipal,
            eligibilityMessage: isEligible ? null : 'Subject is not in student\'s combination'
          };
        });

        // Filter students based on eligibility if required
        const filteredStudents = includeIneligible
          ? processedStudents
          : processedStudents.filter(student => student.isEligible);

        // Get class details
        const classResponse = await api.get(`/api/classes/${classId}`);
        const classDetails = classResponse.data;

        // Try to get subject combinations for this class to improve filtering
        try {
          const combinationsResponse = await api.get(`/api/subject-combinations?classId=${classId}`);
          if (combinationsResponse.data && Array.isArray(combinationsResponse.data)) {
            // Find combinations that include this subject
            const relevantCombinations = combinationsResponse.data.filter(combo => {
              if (!combo.subjects || !Array.isArray(combo.subjects)) return false;

              return combo.subjects.some(s => {
                // Direct ID match
                if (s.subjectId === subjectId) return true;

                // Object ID match
                if (s.subject && s.subject._id === subjectId) return true;

                // String ID match
                if (s.subject && s.subject.id === subjectId) return true;

                // String comparison
                if (s.subjectId && s.subjectId.toString() === subjectId.toString()) return true;

                // Code match
                if (subjectCode && s.subject && s.subject.code &&
                    s.subject.code.toLowerCase() === subjectCode) {
                  return true;
                }

                return false;
              });
            });

            // If we found relevant combinations, check each student's combination
            if (relevantCombinations.length > 0) {
              const combinationIds = relevantCombinations.map(c => c._id || c.id);

              // Update eligibility for students with matching combinations
              for (const student of processedStudents) {
                if (!student.isEligible && student.subjectCombinationId) {
                  if (combinationIds.includes(student.subjectCombinationId)) {
                    student.isEligible = true;
                  }
                }

                // Also check if combination is a string reference
                if (!student.isEligible && student.combination &&
                    typeof student.combination === 'string') {
                  if (combinationIds.includes(student.combination)) {
                    student.isEligible = true;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Could not get subject combinations:', err.message);
        }

        // Recalculate filtered students after combination check
        const finalFilteredStudents = includeIneligible
          ? processedStudents
          : processedStudents.filter(student => student.isEligible);

        return {
          success: true,
          data: {
            class: classDetails,
            subject,
            students: finalFilteredStudents,
            eligibleCount: processedStudents.filter(s => s.isEligible).length,
            totalCount: processedStudents.length
          }
        };
      }

      // If it's another error, rethrow it
      throw prismaError;
    }
  } catch (error) {
    console.error('Error getting students filtered by subject:', error);

    // Return a standardized error response
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error getting students',
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

      try {
        // Check if marks already exist for this student
        let existingResult = null;
        // Format student ID properly - handle both _id and id formats
        const studentId = student.id || student._id || `unknown-${Math.random().toString(36).substring(7)}`;

        try {
          const resultsResponse = await api.get(`/api/new-a-level/results/student/${studentId}/exam/${examId}`);
          if (resultsResponse.data?.results) {
            existingResult = resultsResponse.data.results.find(
              result => result.subjectId &&
              (result.subjectId === subjectId ||
               (result.subjectId._id && result.subjectId._id === subjectId) ||
               (result.subjectId.toString() === subjectId.toString()))
            );
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
          isPrincipal: existingResult ? existingResult.isPrincipal : (student.isPrincipal || false),
          isInCombination: student.isEligible || false,
          eligibilityWarning: student.eligibilityMessage || 'Subject may not be in student\'s combination',
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
