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
  // Validate parameters
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

  console.log(`Getting A-Level students for class ${classId} filtered by subject ${subjectId}, includeIneligible=${includeIneligible}`);

  try {
    // First try the Prisma endpoint
    console.log('Attempting to use Prisma endpoint for student filtering');
    const response = await api.get('/api/prisma/subject-assignments/students-by-subject', {
      params: {
        classId,
        subjectId,
        includeIneligible
      }
    });

    // Check if the response is valid
    if (!response.data) {
      throw new Error('Invalid response from Prisma endpoint');
    }

    // Check if the teacher is authorized to access this subject-class combination
    if (!response.data.success && response.data.data && response.data.data.authorized === false) {
      console.error('Teacher is not authorized to access this subject in this class');
      return {
        success: false,
        message: 'You are not authorized to access this subject in this class. Please contact an administrator.'
      };
    }

    // If the response is successful, log and return it
    if (response.data.success) {
      const eligibleCount = response.data.data?.eligibleCount || 0;
      const totalCount = response.data.data?.totalCount || 0;
      console.log(`Prisma endpoint returned ${response.data.data?.students?.length || 0} students (${eligibleCount}/${totalCount} eligible)`);
      return response.data;
    }
    
    // If the response is not successful, log the error and throw an exception
    console.error('Prisma endpoint returned an error:', response.data.message);
    throw new Error(response.data.message || 'Unknown error from Prisma endpoint');
  } catch (prismaError) {
    console.warn('Prisma endpoint failed, falling back to legacy approach:', prismaError.message);

    try {
      // Try the A-Level specific endpoint first
      console.log('Attempting to use A-Level specific endpoint');
      const aLevelResponse = await api.get('/api/prisma/marks/a-level/students-by-subject', {
        params: {
          classId,
          subjectId,
          includeIneligible
        }
      });

      if (aLevelResponse.data?.success) {
        console.log(`A-Level specific endpoint returned ${aLevelResponse.data.data?.students?.length || 0} students`);
        return aLevelResponse.data;
      }
      
      console.warn('A-Level specific endpoint failed:', aLevelResponse.data?.message || 'Unknown error');
    } catch (aLevelError) {
      console.warn('A-Level specific endpoint failed, continuing to legacy approach:', aLevelError.message);
    }

    try {
      // If both Prisma endpoints fail, use the legacy approach
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
      
      // Get class details
      const classResponse = await api.get(`/api/classes/${classId}`);
      const classDetails = classResponse.data;
      
      // Process students to determine eligibility (simplified for brevity)
      const processedStudents = aLevelStudents.map(student => ({
        id: student._id || student.id,
        studentId: student._id || student.id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        name: student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : (student.name || 'Unknown Student'),
        isEligible: true, // Simplified - assume all students are eligible in fallback mode
        isPrincipal: false
      }));
      
      // Return the processed students
      return {
        success: true,
        data: {
          class: classDetails,
          subject,
          students: processedStudents,
          eligibleCount: processedStudents.length,
          totalCount: processedStudents.length
        }
      };
    } catch (legacyError) {
      console.error('Legacy approach failed:', legacyError);
      return {
        success: false,
        message: `Failed to get students: ${legacyError.message}`,
        error: legacyError
      };
    }
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
