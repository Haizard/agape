/**
 * Unified Grade Calculator
 *
 * This utility provides consistent grade and points calculation for both O-Level and A-Level.
 * It replaces the separate grading utilities to ensure consistency across the system.
 */

const logger = require('./logger');

// Education level constants
const EDUCATION_LEVELS = {
  O_LEVEL: 'O_LEVEL',
  A_LEVEL: 'A_LEVEL'
};

/**
 * O-Level grading scale
 * Based on Tanzania's NECTA CSEE system
 */
const O_LEVEL_GRADES = [
  { grade: 'A', minMarks: 75, maxMarks: 100, points: 1 },
  { grade: 'B', minMarks: 65, maxMarks: 74, points: 2 },
  { grade: 'C', minMarks: 45, maxMarks: 64, points: 3 },
  { grade: 'D', minMarks: 30, maxMarks: 44, points: 4 },
  { grade: 'F', minMarks: 0, maxMarks: 29, points: 5 }
];

/**
 * A-Level grading scale
 * Based on Tanzania's NECTA ACSEE system
 */
const A_LEVEL_GRADES = [
  { grade: 'A', minMarks: 80, maxMarks: 100, points: 1 },
  { grade: 'B', minMarks: 70, maxMarks: 79, points: 2 },
  { grade: 'C', minMarks: 60, maxMarks: 69, points: 3 },
  { grade: 'D', minMarks: 50, maxMarks: 59, points: 4 },
  { grade: 'E', minMarks: 40, maxMarks: 49, points: 5 },
  { grade: 'S', minMarks: 35, maxMarks: 39, points: 6 },
  { grade: 'F', minMarks: 0, maxMarks: 34, points: 7 }
];

/**
 * O-Level division boundaries
 * Based on Tanzania's NECTA CSEE system
 */
const O_LEVEL_DIVISIONS = [
  { division: 'I', minPoints: 7, maxPoints: 17 },
  { division: 'II', minPoints: 18, maxPoints: 21 },
  { division: 'III', minPoints: 22, maxPoints: 25 },
  { division: 'IV', minPoints: 26, maxPoints: 33 },
  { division: '0', minPoints: 34, maxPoints: Infinity }
];

/**
 * A-Level division boundaries
 * Based on Tanzania's NECTA ACSEE system
 */
const A_LEVEL_DIVISIONS = [
  { division: 'I', minPoints: 3, maxPoints: 9 },
  { division: 'II', minPoints: 10, maxPoints: 12 },
  { division: 'III', minPoints: 13, maxPoints: 17 },
  { division: 'IV', minPoints: 18, maxPoints: 19 },
  { division: '0', minPoints: 20, maxPoints: Infinity }
];

/**
 * Calculate grade and points based on marks and education level
 * @param {Number} marks - The marks obtained (0-100)
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Object} - Object containing grade and points
 */
function calculateGradeAndPoints(marks, educationLevel) {
  // Validate inputs
  if (marks === undefined || marks === null) {
    logger.warn(`Invalid marks value for grade calculation: ${marks}`);
    return { grade: 'N/A', points: 0 };
  }

  // Convert to number if string
  const numMarks = Number(marks);

  // Check for NaN
  if (Number.isNaN(numMarks)) {
    logger.warn(`Invalid marks value for grade calculation: ${marks}`);
    return { grade: 'N/A', points: 0 };
  }

  // Validate marks range
  if (numMarks < 0 || numMarks > 100) {
    logger.warn(`Marks out of range for grade calculation: ${numMarks}`);
    return { grade: 'N/A', points: 0 };
  }

  // Get the appropriate grading scale
  const gradingScale = educationLevel === EDUCATION_LEVELS.A_LEVEL
    ? A_LEVEL_GRADES
    : O_LEVEL_GRADES;

  // Find the grade
  const gradeInfo = gradingScale.find(
    g => numMarks >= g.minMarks && numMarks <= g.maxMarks
  );

  if (!gradeInfo) {
    logger.error(`Could not determine grade for marks ${numMarks} and education level ${educationLevel}`);
    return { grade: 'N/A', points: 0 };
  }

  return {
    grade: gradeInfo.grade,
    points: gradeInfo.points
  };
}

/**
 * Calculate grade based on marks and education level
 * @param {Number} marks - The marks obtained (0-100)
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {String} - The grade
 */
function calculateGrade(marks, educationLevel) {
  return calculateGradeAndPoints(marks, educationLevel).grade;
}

/**
 * Calculate points based on marks and education level
 * @param {Number} marks - The marks obtained (0-100)
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Number} - The points
 */
function calculatePoints(marks, educationLevel) {
  return calculateGradeAndPoints(marks, educationLevel).points;
}

/**
 * Calculate points based on grade and education level
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Number} - The points
 */
function calculatePointsFromGrade(grade, educationLevel) {
  // Get the appropriate grading scale
  const gradingScale = educationLevel === EDUCATION_LEVELS.A_LEVEL
    ? A_LEVEL_GRADES
    : O_LEVEL_GRADES;

  // Find the grade
  const gradeInfo = gradingScale.find(g => g.grade === grade);

  if (!gradeInfo) {
    logger.error(`Could not determine points for grade ${grade} and education level ${educationLevel}`);
    return 0;
  }

  return gradeInfo.points;
}

/**
 * Calculate division based on total points and education level
 * @param {Number} totalPoints - Total points
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {String} - Division (I, II, III, IV, 0)
 */
function calculateDivision(totalPoints, educationLevel) {
  // Validate inputs
  if (totalPoints === undefined || totalPoints === null) {
    logger.warn(`Invalid total points for division calculation: ${totalPoints}`);
    return 'N/A';
  }

  // Convert to number if string
  const numPoints = Number(totalPoints);

  // Check for NaN
  if (Number.isNaN(numPoints)) {
    logger.warn(`Invalid total points for division calculation: ${totalPoints}`);
    return 'N/A';
  }

  // Get the appropriate division scale
  const divisionScale = educationLevel === EDUCATION_LEVELS.A_LEVEL
    ? A_LEVEL_DIVISIONS
    : O_LEVEL_DIVISIONS;

  // Find the division
  const divisionInfo = divisionScale.find(
    d => numPoints >= d.minPoints && numPoints <= d.maxPoints
  );

  if (!divisionInfo) {
    logger.error(`Could not determine division for points ${numPoints} and education level ${educationLevel}`);
    return 'N/A';
  }

  return divisionInfo.division;
}

/**
 * Calculate O-Level division based on total points from best 7 subjects
 * @param {Number} totalPoints - Total points from best 7 subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
function calculateOLevelDivision(totalPoints) {
  return calculateDivision(totalPoints, EDUCATION_LEVELS.O_LEVEL);
}

/**
 * Calculate A-Level division based on total points from best 3 principal subjects
 * @param {Number} totalPoints - Total points from best 3 principal subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
function calculateALevelDivision(totalPoints) {
  return calculateDivision(totalPoints, EDUCATION_LEVELS.A_LEVEL);
}

/**
 * O-Level core subjects
 * These are the required subjects for O-Level division calculation
 */
const O_LEVEL_CORE_SUBJECTS = [
  'ENGLISH',
  'KISWAHILI',
  'MATHEMATICS',
  'BIOLOGY',
  'CIVICS',
  'GEOGRAPHY',
  'HISTORY'
];

/**
 * Calculate best seven subjects and division for O-Level with enhanced validation
 * @param {Array} results - Array of subject results
 * @returns {Object} - Object containing bestSevenResults, bestSevenPoints, division, and validation info
 */
function calculateOLevelBestSevenAndDivision(results) {
  // Ensure we have results
  if (!results || !Array.isArray(results) || results.length === 0) {
    return {
      bestSevenResults: [],
      bestSevenPoints: 0,
      division: 'N/A',
      validationResult: {
        isValid: false,
        message: 'No results provided'
      }
    };
  }

  // Ensure each result has points
  const resultsWithPoints = results.map(result => {
    if (result.points === undefined) {
      const { grade, points } = calculateGradeAndPoints(
        result.marksObtained || result.marks || 0,
        EDUCATION_LEVELS.O_LEVEL
      );
      return {
        ...result,
        grade,
        points
      };
    }
    return result;
  });

  // Filter out results with no marks or grades
  const validResults = resultsWithPoints.filter(result => {
    // Check if the result has valid marks or grade
    return (
      ((result.marksObtained > 0 || result.marks > 0) && result.grade !== '-') ||
      (result.grade && result.grade !== '-')
    );
  });

  // Validate subjects for division calculation
  const validationResult = validateSubjectsForDivision(validResults, EDUCATION_LEVELS.O_LEVEL);

  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...validResults].sort((a, b) => (a.points || 5) - (b.points || 5));

  // Take the best 7 subjects (or all if less than 7)
  const bestSevenResults = sortedResults.slice(0, Math.min(7, sortedResults.length));

  // Calculate total points from best subjects
  const bestSevenPoints = bestSevenResults.reduce((sum, result) => sum + (result.points || 5), 0);

  // Calculate division based on total points
  const division = calculateOLevelDivision(bestSevenPoints);

  // Check if we have enough subjects for a valid division calculation
  const hasEnoughSubjects = validResults.length >= 7;

  // Check if we have all required core subjects
  const coreSubjectCodes = new Set(O_LEVEL_CORE_SUBJECTS);
  const studentSubjectCodes = new Set(
    validResults.map(r => {
      // Try to get the subject code from different possible structures
      if (r.subject?.code) return r.subject.code.toUpperCase();
      if (r.subjectId?.code) return r.subjectId.code.toUpperCase();
      if (r.code) return r.code.toUpperCase();
      return null;
    }).filter(code => code !== null)
  );

  // Find missing core subjects
  const missingCoreSubjects = [];
  for (const coreSubject of coreSubjectCodes) {
    if (!studentSubjectCodes.has(coreSubject)) {
      missingCoreSubjects.push(coreSubject);
    }
  }

  // Add warnings for missing subjects
  let warning = null;
  if (!hasEnoughSubjects) {
    warning = `Student has only ${validResults.length} subjects. At least 7 subjects are required for accurate division calculation.`;
  } else if (missingCoreSubjects.length > 0) {
    warning = `Student is missing ${missingCoreSubjects.length} core subjects: ${missingCoreSubjects.join(', ')}`;
  }

  return {
    bestSevenResults,
    bestSevenPoints,
    division,
    validationResult,
    warning,
    missingSubjects: 7 - validResults.length > 0 ? 7 - validResults.length : 0,
    missingCoreSubjects: missingCoreSubjects.length > 0 ? missingCoreSubjects : null,
    hasEnoughSubjects
  };
}

/**
 * Validate if a student has enough subjects for division calculation
 * @param {Array} results - Array of result objects
 * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {Object} - Object with isValid flag and message
 */
function validateSubjectsForDivision(results, educationLevel) {
  if (!results || !Array.isArray(results)) {
    return {
      isValid: false,
      message: 'No results provided'
    };
  }

  if (educationLevel === EDUCATION_LEVELS.O_LEVEL) {
    // O-Level requires at least 7 subjects
    if (results.length < 7) {
      return {
        isValid: false,
        message: `Student has only ${results.length} subjects. At least 7 subjects are required for division calculation.`,
        missingSubjects: 7 - results.length
      };
    }

    // Check for required core subjects
    const coreSubjectCodes = new Set(O_LEVEL_CORE_SUBJECTS);
    const studentSubjectCodes = new Set(
      results.map(r => {
        // Try to get the subject code from different possible structures
        if (r.subject?.code) return r.subject.code.toUpperCase();
        if (r.subjectId?.code) return r.subjectId.code.toUpperCase();
        if (r.code) return r.code.toUpperCase();
        return null;
      }).filter(code => code !== null)
    );

    // Find missing core subjects
    const missingCoreSubjects = [];
    for (const coreSubject of coreSubjectCodes) {
      if (!studentSubjectCodes.has(coreSubject)) {
        missingCoreSubjects.push(coreSubject);
      }
    }

    if (missingCoreSubjects.length > 0) {
      return {
        isValid: false,
        message: `Student is missing ${missingCoreSubjects.length} core subjects: ${missingCoreSubjects.join(', ')}`,
        missingCoreSubjects,
        isWarningOnly: true // This is a warning, not an error
      };
    }
  } else if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
    // A-Level requires at least 3 principal subjects
    const principalResults = results.filter(r => r.isPrincipal);
    if (principalResults.length < 3) {
      return {
        isValid: false,
        message: `Student has only ${principalResults.length} principal subjects. At least 3 principal subjects are required for division calculation.`,
        missingPrincipalSubjects: 3 - principalResults.length
      };
    }

    // A-Level also requires at least 2 subsidiary subjects
    const subsidiaryResults = results.filter(r => r.isSubsidiary);
    if (subsidiaryResults.length < 2) {
      return {
        isValid: false,
        message: `Student has only ${subsidiaryResults.length} subsidiary subjects. At least 2 subsidiary subjects are recommended.`,
        missingSubsidiarySubjects: 2 - subsidiaryResults.length,
        isWarningOnly: true // This is a warning, not an error
      };
    }
  }

  return {
    isValid: true,
    message: 'Student has enough subjects for division calculation'
  };
}

module.exports = {
  EDUCATION_LEVELS,
  O_LEVEL_GRADES,
  A_LEVEL_GRADES,
  O_LEVEL_DIVISIONS,
  A_LEVEL_DIVISIONS,
  O_LEVEL_CORE_SUBJECTS,
  calculateGradeAndPoints,
  calculateGrade,
  calculatePoints,
  calculatePointsFromGrade,
  calculateDivision,
  calculateOLevelDivision,
  calculateALevelDivision,
  calculateOLevelBestSevenAndDivision,
  validateSubjectsForDivision
};
