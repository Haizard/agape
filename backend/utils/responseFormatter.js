/**
 * Response Formatter Utility
 *
 * This utility provides standardized formatting for API responses
 * to ensure consistency across the application.
 */
const logger = require('./logger');

/**
 * Format A-Level student response
 * @param {Object} student - Student object
 * @param {Array} results - Array of result objects
 * @param {Object} exam - Exam object
 * @param {Object} classObj - Class object
 * @returns {Object} - Formatted response
 */
const formatALevelStudentResponse = (student, results, exam, classObj) => {
  try {
    // Extract subject results
    const subjectResults = results.map(result => ({
      subject: result.subjectId?.name || 'Unknown',
      code: result.subjectId?.code || 'Unknown',
      marks: result.marksObtained || 0,
      grade: result.grade || '-',
      points: result.points || 0,
      isPrincipal: result.isPrincipal || false,
      remarks: getRemarks(result.grade)
    }));

    // Separate principal and subsidiary subjects
    const principalSubjects = subjectResults.filter(result => result.isPrincipal);
    const subsidiarySubjects = subjectResults.filter(result => !result.isPrincipal);

    // Calculate totals
    const totalMarks = subjectResults.reduce((sum, result) => sum + result.marks, 0);
    const totalPoints = subjectResults.reduce((sum, result) => sum + result.points, 0);
    const averageMarks = subjectResults.length > 0 ? totalMarks / subjectResults.length : 0;

    // Calculate best three principal subjects
    const bestThreePrincipal = [...principalSubjects]
      .sort((a, b) => a.points - b.points)
      .slice(0, Math.min(3, principalSubjects.length));

    const bestThreePoints = bestThreePrincipal.reduce((sum, subject) => sum + subject.points, 0);

    // Calculate grade distribution
    const gradeDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 };
    for (const result of subjectResults) {
      if (gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    }

    // Format the response
    return {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: exam.academicYear ? (typeof exam.academicYear === 'object' ? exam.academicYear.name : exam.academicYear) : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: classObj ? `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim() : 'Unknown',
        gender: student.gender,
        form: student.form || 'Unknown'
      },
      subjectResults,
      principalSubjects,
      subsidiarySubjects,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestThreePoints,
        division: calculateDivision(bestThreePoints),
        gradeDistribution
      },
      educationLevel: 'A_LEVEL'
    };
  } catch (error) {
    logger.error(`Error formatting A-Level student response: ${error.message}`);
    throw error;
  }
};

/**
 * Format A-Level class response
 * @param {Object} classObj - Class object
 * @param {Object} exam - Exam object
 * @param {Array} studentResults - Array of student results
 * @returns {Object} - Formatted response
 */
const formatALevelClassResponse = (classObj, exam, studentResults) => {
  try {
    // Calculate division distribution
    const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, '0': 0 };

    // Count students in each division
    for (const student of studentResults) {
      if (student.division) {
        // Handle different division formats
        let divKey = student.division;
        if (divKey.includes('Division')) {
          divKey = divKey.replace('Division ', '');
        }
        if (divisionDistribution[divKey] !== undefined) {
          divisionDistribution[divKey]++;
        }
      }
    }

    // Calculate class average
    const totalMarks = studentResults.reduce((sum, student) => sum + (student.totalMarks || 0), 0);
    const classAverage = studentResults.length > 0 ? totalMarks / studentResults.length : 0;

    // Format the response
    return {
      reportTitle: `${exam.name} Class Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: classObj.academicYear ? (typeof classObj.academicYear === 'object' ? classObj.academicYear.name : classObj.academicYear) : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      students: studentResults,
      classAverage,
      totalStudents: studentResults.length,
      divisionDistribution,
      educationLevel: 'A_LEVEL'
    };
  } catch (error) {
    logger.error(`Error formatting A-Level class response: ${error.message}`);
    throw error;
  }
};

/**
 * Format O-Level student response
 * @param {Object} student - Student object
 * @param {Array} results - Array of result objects
 * @param {Object} exam - Exam object
 * @param {Object} classObj - Class object
 * @returns {Object} - Formatted response
 */
const formatOLevelStudentResponse = (student, results, exam, classObj) => {
  try {
    // Extract subject results
    const subjectResults = results.map(result => ({
      subject: result.subjectId?.name || 'Unknown',
      code: result.subjectId?.code || 'Unknown',
      marks: result.marksObtained || 0,
      grade: result.grade || '-',
      points: result.points || 0,
      remarks: getOLevelRemarks(result.grade)
    }));

    // Calculate totals
    const totalMarks = subjectResults.reduce((sum, result) => sum + result.marks, 0);
    const totalPoints = subjectResults.reduce((sum, result) => sum + result.points, 0);
    const averageMarks = subjectResults.length > 0 ? totalMarks / subjectResults.length : 0;

    // Calculate best seven subjects
    const bestSevenSubjects = [...subjectResults]
      .sort((a, b) => a.points - b.points)
      .slice(0, Math.min(7, subjectResults.length));

    const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

    // Calculate grade distribution
    const gradeDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    for (const result of subjectResults) {
      if (gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    }

    // Format the response
    return {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: exam.academicYear ? (typeof exam.academicYear === 'object' ? exam.academicYear.name : exam.academicYear) : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: classObj ? `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim() : 'Unknown',
        gender: student.gender,
        form: student.form || 'Unknown'
      },
      subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        division: calculateOLevelDivision(bestSevenPoints),
        gradeDistribution
      },
      educationLevel: 'O_LEVEL'
    };
  } catch (error) {
    logger.error(`Error formatting O-Level student response: ${error.message}`);
    throw error;
  }
};

/**
 * Format O-Level class response
 * @param {Object} classObj - Class object
 * @param {Object} exam - Exam object
 * @param {Array} studentResults - Array of student results
 * @returns {Object} - Formatted response
 */
const formatOLevelClassResponse = (classObj, exam, studentResults) => {
  try {
    // Calculate division distribution
    const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };

    // Count students in each division
    for (const student of studentResults) {
      if (student.division) {
        // Handle different division formats
        let divKey = student.division;
        if (divKey.includes('Division')) {
          divKey = divKey.replace('Division ', '');
        }
        if (divisionDistribution[divKey] !== undefined) {
          divisionDistribution[divKey]++;
        }
      }
    }

    // Calculate class average
    const totalMarks = studentResults.reduce((sum, student) => sum + (student.totalMarks || 0), 0);
    const classAverage = studentResults.length > 0 ? totalMarks / studentResults.length : 0;

    // Format the response
    return {
      reportTitle: `${exam.name} Class Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: classObj.academicYear ? (typeof classObj.academicYear === 'object' ? classObj.academicYear.name : classObj.academicYear) : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      students: studentResults,
      classAverage,
      totalStudents: studentResults.length,
      divisionDistribution,
      educationLevel: 'O_LEVEL'
    };
  } catch (error) {
    logger.error(`Error formatting O-Level class response: ${error.message}`);
    throw error;
  }
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {string} source - Source of the error
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (error, source) => {
  logger.error(`Error in ${source}: ${error.message}`);

  return {
    success: false,
    message: error.message || 'An error occurred',
    source,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted success response
 */
const formatSuccessResponse = (data, message = 'Operation successful') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Helper function to get remarks based on grade for A-Level
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @returns {String} - The remarks
 */
function getRemarks(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'E': return 'Pass';
    case 'S': return 'Subsidiary Pass';
    case 'F': return 'Fail';
    default: return 'Not Graded';
  }
}

/**
 * Helper function to get remarks based on grade for O-Level
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {String} - The remarks
 */
function getOLevelRemarks(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'F': return 'Fail';
    default: return 'Not Graded';
  }
}

/**
 * Calculate A-LEVEL division based on points
 * @param {Number} points - The total points from best 3 principal subjects
 * @returns {String} - The division (I, II, III, IV, V)
 */
function calculateDivision(points) {
  // Handle edge cases
  if (points === undefined || points === null || Number.isNaN(Number(points))) {
    logger.warn(`Invalid points value for A-Level division calculation: ${points}`);
    return 'Division 0';
  }

  // Convert to number
  const numPoints = Number(points);

  // Calculate division based on Tanzania's NECTA ACSEE system
  if (numPoints >= 3 && numPoints <= 9) return 'Division I';
  if (numPoints >= 10 && numPoints <= 12) return 'Division II';
  if (numPoints >= 13 && numPoints <= 17) return 'Division III';
  if (numPoints >= 18 && numPoints <= 19) return 'Division IV';
  return 'Division 0';
}

/**
 * Calculate O-LEVEL division based on points
 * @param {Number} points - The total points from best 7 subjects
 * @returns {String} - The division (I, II, III, IV, 0)
 */
function calculateOLevelDivision(points) {
  // Handle edge cases
  if (points === undefined || points === null || Number.isNaN(Number(points))) {
    logger.warn(`Invalid points value for O-Level division calculation: ${points}`);
    return 'Division 0';
  }

  // Convert to number
  const numPoints = Number(points);

  // Calculate division based on Tanzania's NECTA CSEE system
  if (numPoints >= 7 && numPoints <= 17) return 'Division I';
  if (numPoints >= 18 && numPoints <= 21) return 'Division II';
  if (numPoints >= 22 && numPoints <= 25) return 'Division III';
  if (numPoints >= 26 && numPoints <= 33) return 'Division IV';
  return 'Division 0';
}

module.exports = {
  formatALevelStudentResponse,
  formatALevelClassResponse,
  formatOLevelStudentResponse,
  formatOLevelClassResponse,
  formatErrorResponse,
  formatSuccessResponse
};
