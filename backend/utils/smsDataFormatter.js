/**
 * SMS Data Formatter
 * 
 * This utility standardizes data structures for SMS messages,
 * ensuring consistent formatting across different parts of the application.
 */
const logger = require('./logger');

/**
 * Format a phone number to the standard format for SMS sending
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - The formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle Tanzanian phone numbers
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    // Add country code for 9-digit numbers without leading zero
    return `+255${cleaned}`;
  } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Replace leading zero with country code
    return `+255${cleaned.substring(1)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('255')) {
    // Add + for numbers starting with country code
    return `+${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('+255')) {
    // Already in the correct format
    return phoneNumber;
  }
  
  // For non-Tanzanian numbers or other formats, just ensure it has a + prefix
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

/**
 * Standardize student result data for SMS messages
 * @param {Object} student - Student information
 * @param {Object} resultData - Result data in any format
 * @returns {Object} - Standardized result data
 */
const standardizeResultData = (student, resultData) => {
  try {
    // Create a standard structure for result data
    const standardData = {
      student: {
        id: student._id || resultData.studentId,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber
      },
      exam: {
        id: resultData.examId,
        name: resultData.examName || 'Exam'
      },
      class: {
        id: student.class?._id || resultData.classId,
        name: student.class?.name || resultData.class?.name || 'Unknown Class',
        section: student.class?.section || resultData.class?.section || '',
        stream: student.class?.stream || resultData.class?.stream || ''
      },
      summary: {
        totalMarks: resultData.totalMarks || 0,
        averageMarks: resultData.averageMarks || 0,
        division: resultData.division || 'N/A',
        points: resultData.points || 0,
        bestSevenPoints: resultData.bestSevenPoints,
        rank: resultData.rank || 'N/A',
        totalStudents: resultData.totalStudents || 0
      },
      subjects: []
    };
    
    // Handle different formats of subject data
    if (Array.isArray(resultData.subjects)) {
      // If subjects is an array (new format)
      standardData.subjects = resultData.subjects.map(subject => ({
        id: subject.subject?._id || subject.subjectId,
        name: subject.subject?.name || subject.subjectName || 'Subject',
        code: subject.subject?.code || subject.subjectCode || '',
        marks: subject.marks || subject.marksObtained || 0,
        grade: subject.grade || '-',
        points: subject.points || 0,
        present: subject.present !== false
      }));
    } else if (typeof resultData.subjects === 'object' && resultData.subjects !== null) {
      // If subjects is an object (old format)
      standardData.subjects = Object.entries(resultData.subjects)
        .map(([id, subject]) => ({
          id: id,
          name: subject.subjectName || 'Subject',
          code: subject.subjectCode || '',
          marks: subject.marks || 0,
          grade: subject.grade || '-',
          points: subject.points || 0,
          present: subject.present !== false
        }));
    }
    
    return standardData;
  } catch (error) {
    logger.error('Error standardizing result data:', error);
    // Return a minimal valid structure if there's an error
    return {
      student: {
        id: student._id || 'unknown',
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
        rollNumber: student.rollNumber || 'N/A'
      },
      exam: {
        name: resultData.examName || 'Exam'
      },
      summary: {
        averageMarks: resultData.averageMarks || 0,
        division: resultData.division || 'N/A',
        points: resultData.points || 0
      },
      subjects: []
    };
  }
};

/**
 * Create a standardized SMS message object
 * @param {Object} options - Message options
 * @returns {Object} - Standardized message object
 */
const createSmsMessageObject = (options) => {
  const {
    phoneNumber,
    message,
    recipientName = '',
    messageType = 'OTHER',
    studentId = null,
    studentName = '',
    parentId = null,
    parentName = '',
    parentRelationship = '',
    examId = null,
    classId = null,
    academicYearId = null,
    userId = null,
    userName = '',
    userRole = ''
  } = options;
  
  return {
    recipient: {
      phoneNumber: formatPhoneNumber(phoneNumber),
      name: recipientName
    },
    message,
    messageType,
    student: studentId ? {
      id: studentId,
      name: studentName
    } : undefined,
    parent: parentId ? {
      id: parentId,
      name: parentName,
      relationship: parentRelationship
    } : undefined,
    relatedData: {
      examId,
      classId,
      academicYearId
    },
    sentBy: userId ? {
      userId,
      name: userName,
      role: userRole
    } : undefined
  };
};

module.exports = {
  formatPhoneNumber,
  standardizeResultData,
  createSmsMessageObject
};
