/**
 * A-Level Grade Calculator
 *
 * This utility provides grade calculation functions specifically for A-Level (Form 5-6)
 * following Tanzania's ACSEE grading system.
 */
const logger = require('./logger');

/**
 * Calculate grade and points based on marks for A-Level
 * @param {Number} marks - The marks obtained (0-100)
 * @returns {Object} - Object containing grade and points
 */
const calculateGradeAndPoints = (marks) => {
  // Validate inputs
  if (marks === undefined || marks === null) {
    return { grade: '-', points: 0 };
  }

  // Convert to number if string
  const numMarks = Number(marks);

  // Check for NaN
  if (Number.isNaN(numMarks)) {
    logger.warn(`Invalid marks value for A-Level: ${marks}`);
    return { grade: '-', points: 0 };
  }

  // A-LEVEL grading based on Tanzania's ACSEE system
  let grade, points;

  if (numMarks >= 80) {
    grade = 'A';
    points = 1;
  } else if (numMarks >= 70) {
    grade = 'B';
    points = 2;
  } else if (numMarks >= 60) {
    grade = 'C';
    points = 3;
  } else if (numMarks >= 50) {
    grade = 'D';
    points = 4;
  } else if (numMarks >= 40) {
    grade = 'E';
    points = 5;
  } else if (numMarks >= 35) {
    grade = 'S';
    points = 6;
  } else {
    grade = 'F';
    points = 7;
  }

  return { grade, points };
};

/**
 * Calculate A-Level division based on points from best 3 principal subjects
 * @param {Number} points - Total points from best 3 principal subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
const calculateDivision = (points) => {
  // Handle edge cases
  if (points === undefined || points === null || Number.isNaN(Number(points))) {
    logger.warn(`Invalid points value for A-Level division calculation: ${points}`);
    return '0';
  }

  // Convert to number
  const numPoints = Number(points);

  // Calculate division based on Tanzania's NECTA ACSEE system
  if (numPoints >= 3 && numPoints <= 9) return 'I';
  if (numPoints >= 10 && numPoints <= 12) return 'II';
  if (numPoints >= 13 && numPoints <= 17) return 'III';
  if (numPoints >= 18 && numPoints <= 19) return 'IV';
  return '0';
};

/**
 * Get remarks based on grade for A-Level
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @returns {String} - The remarks
 */
const getRemarks = (grade) => {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'E': return 'Pass';
    case 'S': return 'Subsidiary Pass';
    case 'F': return 'Fail';
    default: return '-';
  }
};

/**
 * Calculate best three principal subjects and division for A-Level
 * @param {Array} results - Array of subject results
 * @param {Array} principalSubjectIds - Array of principal subject IDs
 * @returns {Object} - Object containing bestThreeResults, bestThreePoints, and division
 */
const calculateBestThreeAndDivision = (results, principalSubjectIds = []) => {
  // Ensure each result has points
  const resultsWithPoints = results.map(result => {
    if (result.points === undefined) {
      const { grade, points } = calculateGradeAndPoints(
        result.marksObtained || result.marks
      );
      return {
        ...result,
        grade,
        points
      };
    }
    return result;
  });

  // Filter for principal subjects
  let principalResults = [];

  // Method 1: Use provided principal subject IDs if available
  if (principalSubjectIds && principalSubjectIds.length > 0) {
    principalResults = resultsWithPoints.filter(result => {
      const subjectId = result.subjectId?._id || result.subjectId || result.subject?._id || result.subject;
      return principalSubjectIds.some(id =>
        id.toString() === (subjectId?.toString ? subjectId.toString() : subjectId)
      );
    });
    logger.debug(`Found ${principalResults.length} principal subjects using provided IDs`);
  }

  // Method 2: If no results found or no IDs provided, check isPrincipal flag
  if (principalResults.length === 0) {
    principalResults = resultsWithPoints.filter(result => {
      // Check multiple possible locations for isPrincipal flag
      return result.isPrincipal === true ||
             (result.subject && result.subject.isPrincipal === true) ||
             (result.subjectId && result.subjectId.isPrincipal === true);
    });
    logger.debug(`Found ${principalResults.length} principal subjects using isPrincipal flag`);
  }

  // Method 3: If still no results, use best subjects as fallback
  if (principalResults.length === 0) {
    logger.warn('No principal subjects found for A-Level division calculation. Using best subjects as fallback.');
    // Sort by points and take the best 3 as a fallback
    principalResults = [...resultsWithPoints].sort((a, b) => (a.points || 7) - (b.points || 7)).slice(0, 3);
    logger.debug(`Using ${principalResults.length} best subjects as fallback for principal subjects`);
  }

  // Exclude General Studies from division calculation as per NECTA standards
  principalResults = principalResults.filter(result => {
    const subjectName = result.subject?.name || result.subjectId?.name || '';
    return !subjectName.toLowerCase().includes('general studies');
  });

  // Filter out results with no marks or grades
  const validResults = principalResults.filter(result => {
    // Check if the result has valid marks or grade
    return (
      (result.marksObtained > 0 || result.marks > 0) &&
      result.grade !== '-'
    );
  });

  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...validResults].sort((a, b) => (a.points || 7) - (b.points || 7));

  // Take the best 3 subjects (or all if less than 3)
  const bestThreeResults = sortedResults.slice(0, Math.min(3, sortedResults.length));

  // Calculate total points from best subjects
  const bestThreePoints = bestThreeResults.reduce((sum, result) => sum + (result.points || 7), 0);

  // Log for debugging
  logger.debug('A-Level division calculation:', {
    totalResults: resultsWithPoints.length,
    principalResults: principalResults.length,
    validResults: validResults.length,
    bestThreeResults: bestThreeResults.map(r => ({
      name: r.name || r.subject?.name || r.subjectId?.name || 'Unknown',
      marks: r.marksObtained || r.marks,
      grade: r.grade,
      points: r.points
    })),
    bestThreePoints
  });

  // Calculate division based on total points
  const division = calculateDivision(bestThreePoints);

  return {
    bestThreeResults,
    bestThreePoints,
    division
  };
};

/**
 * Calculate subject GPA based on the formula:
 * Subject GPA = Sum(Number of students with each grade × Grade point value) / Total number of students
 * @param {Object} gradeDistribution - Object with grade counts (A, B, C, D, E, S, F)
 * @param {Number} totalStudents - Total number of students
 * @returns {Number} - The calculated GPA
 */
const calculateSubjectGPA = (gradeDistribution, totalStudents) => {
  // Handle edge case
  if (!totalStudents || totalStudents === 0) {
    return 0;
  }

  // Calculate total points based on grade distribution
  const totalPoints =
    (gradeDistribution.A || 0) * 1 +
    (gradeDistribution.B || 0) * 2 +
    (gradeDistribution.C || 0) * 3 +
    (gradeDistribution.D || 0) * 4 +
    (gradeDistribution.E || 0) * 5 +
    (gradeDistribution.S || 0) * 6 +
    (gradeDistribution.F || 0) * 7;

  // Calculate GPA
  return totalPoints / totalStudents;
};

/**
 * Calculate subject pass rate based on the formula:
 * For principal subjects: Pass Rate = (Count of A + B + C + D + E grades) / Total students × 100%
 * For subsidiary subjects: Pass Rate = (Count of A + B + C + D + E + S grades) / Total students × 100%
 * @param {Object} gradeDistribution - Object with grade counts (A, B, C, D, E, S, F)
 * @param {Number} totalStudents - Total number of students
 * @param {Boolean} isPrincipal - Whether the subject is a principal subject
 * @returns {Number} - The calculated pass rate (percentage)
 */
const calculateSubjectPassRate = (gradeDistribution, totalStudents, isPrincipal) => {
  // Handle edge case
  if (!totalStudents || totalStudents === 0) {
    return 0;
  }

  let passedCount;
  if (isPrincipal) {
    // For principal subjects, A-E are passing grades
    passedCount =
      (gradeDistribution.A || 0) +
      (gradeDistribution.B || 0) +
      (gradeDistribution.C || 0) +
      (gradeDistribution.D || 0) +
      (gradeDistribution.E || 0);
  } else {
    // For subsidiary subjects, A-S are passing grades
    passedCount =
      (gradeDistribution.A || 0) +
      (gradeDistribution.B || 0) +
      (gradeDistribution.C || 0) +
      (gradeDistribution.D || 0) +
      (gradeDistribution.E || 0) +
      (gradeDistribution.S || 0);
  }

  // Calculate pass rate
  return (passedCount / totalStudents) * 100;
};

/**
 * Calculate student rankings based on average marks or points for A-Level
 * @param {Array} students - Array of students with results
 * @param {String} rankBy - Field to rank by ('averageMarks' or 'totalPoints')
 * @returns {Array} - Array of students with rank property added
 */
const calculateStudentRankings = (students, rankBy = 'averageMarks') => {
  // Sort students by the ranking field
  const sortedStudents = [...students].sort((a, b) => {
    // For points, lower is better
    if (rankBy === 'totalPoints' || rankBy === 'bestThreePoints') {
      return (a[rankBy] || 0) - (b[rankBy] || 0);
    }
    // For marks, higher is better
    return (b[rankBy] || 0) - (a[rankBy] || 0);
  });

  // Assign ranks (handling ties according to the formula)
  let currentRank = 0;
  let previousValue = null;
  let studentsAtRank = 0;

  return sortedStudents.map((student, index) => {
    const currentValue = student[rankBy] || 0;

    // If this is the first student or the value is different from the previous one
    if (index === 0 || currentValue !== previousValue) {
      // Skip ranks equal to the number of tied students
      currentRank += studentsAtRank;
      // Start a new rank
      currentRank++;
      studentsAtRank = 1;
    } else {
      // This is a tie, so keep the same rank but count tied students
      studentsAtRank++;
    }

    previousValue = currentValue;

    return {
      ...student,
      rank: currentRank
    };
  });
};

/**
 * Calculate subject positions for students in a class for A-Level
 * @param {Array} results - Array of results for a specific subject
 * @returns {Array} - Array of results with subjectPosition property added
 */
const calculateSubjectPositions = (results) => {
  // Sort results by marks (descending)
  const sortedResults = [...results].sort((a, b) => {
    const marksA = Number(a.marksObtained || a.marks || 0);
    const marksB = Number(b.marksObtained || b.marks || 0);
    return marksB - marksA;
  });

  // Assign positions (handling ties according to the formula)
  let currentPosition = 0;
  let previousMarks = null;
  let studentsAtPosition = 0;

  return sortedResults.map((result, index) => {
    const currentMarks = Number(result.marksObtained || result.marks || 0);

    // If this is the first result or the marks are different from the previous one
    if (index === 0 || currentMarks !== previousMarks) {
      // Skip positions equal to the number of tied students
      currentPosition += studentsAtPosition;
      // Start a new position
      currentPosition++;
      studentsAtPosition = 1;
    } else {
      // This is a tie, so keep the same position but count tied students
      studentsAtPosition++;
    }

    previousMarks = currentMarks;

    return {
      ...result,
      subjectPosition: currentPosition
    };
  });
};

/**
 * Calculate class statistics for a set of A-Level results
 * @param {Array} results - Array of results with marks
 * @returns {Object} - Object containing mean, median, mode, and standardDeviation
 */
const calculateClassStatistics = (results) => {
  // Extract marks from results
  const marks = results.map(result =>
    Number(result.marksObtained || result.marks || 0)
  ).filter(mark => !Number.isNaN(mark));

  // Handle empty array
  if (marks.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      standardDeviation: 0
    };
  }

  // Calculate mean
  const sum = marks.reduce((acc, mark) => acc + mark, 0);
  const mean = sum / marks.length;

  // Calculate median
  const sortedMarks = [...marks].sort((a, b) => a - b);
  const middle = Math.floor(sortedMarks.length / 2);
  const median = sortedMarks.length % 2 === 0
    ? (sortedMarks[middle - 1] + sortedMarks[middle]) / 2
    : sortedMarks[middle];

  // Calculate mode
  const frequency = {};
  for (const mark of marks) {
    frequency[mark] = (frequency[mark] || 0) + 1;
  }

  let mode = 0;
  let maxFrequency = 0;

  for (const [mark, freq] of Object.entries(frequency)) {
    if (freq > maxFrequency) {
      maxFrequency = freq;
      mode = Number(mark);
    }
  }

  // Calculate standard deviation
  const squaredDifferences = marks.map(mark => (mark - mean) ** 2);
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / marks.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean: Number.parseFloat(mean.toFixed(2)),
    median: Number.parseFloat(median.toFixed(2)),
    mode: Number.parseFloat(mode.toFixed(2)),
    standardDeviation: Number.parseFloat(standardDeviation.toFixed(2))
  };
};

/**
 * Determine if a student has passed a subject based on NECTA standards
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @param {Boolean} isPrincipal - Whether the subject is a principal subject
 * @returns {Boolean} - Whether the student has passed
 */
const isPassed = (grade, isPrincipal) => {
  if (isPrincipal) {
    // For principal subjects, A-E are passing grades
    return ['A', 'B', 'C', 'D', 'E'].includes(grade);
  } else {
    // For subsidiary subjects, A-S are passing grades
    return ['A', 'B', 'C', 'D', 'E', 'S'].includes(grade);
  }
};

/**
 * Calculate examination GPA based on the formula:
 * Method 1 (Student-based): Sum of all students' best three points / Total number of students
 * @param {Array} students - Array of students with bestThreePoints
 * @returns {Number} - The calculated examination GPA
 */
const calculateExaminationGPA = (students) => {
  // Handle edge case
  if (!students || students.length === 0) {
    return 0;
  }

  // Calculate total points from all students' best three points
  const totalPoints = students.reduce(
    (sum, student) => sum + (student.bestThreePoints || 0),
    0
  );

  // Calculate examination GPA
  return totalPoints / students.length;
};

/**
 * Calculate class pass rate based on the formula:
 * Class Pass Rate = Number of students with divisions I, II, III, or IV / Total students × 100%
 * @param {Array} students - Array of students with division
 * @returns {Number} - The calculated class pass rate (percentage)
 */
const calculateClassPassRate = (students) => {
  // Handle edge case
  if (!students || students.length === 0) {
    return 0;
  }

  // Count students with passing divisions (I, II, III, IV)
  const passedStudents = students.filter(
    student => student.division && ['I', 'II', 'III', 'IV'].includes(student.division.toString().replace('Division ', ''))
  ).length;

  // Calculate pass rate
  return (passedStudents / students.length) * 100;
};

// Add standalone calculateGrade and calculatePoints for compatibility
function calculateGrade(marks) {
  return calculateGradeAndPoints(marks).grade;
}

function calculatePoints(grade) {
  // Map grade to points as per ACSEE system
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'E': return 5;
    case 'S': return 6;
    case 'F': return 7;
    default: return 0;
  }
}

module.exports = {
  calculateGradeAndPoints,
  calculateDivision,
  getRemarks,
  calculateBestThreeAndDivision,
  calculateStudentRankings,
  calculateSubjectPositions,
  calculateClassStatistics,
  isPassed,
  calculateSubjectGPA,
  calculateSubjectPassRate,
  calculateExaminationGPA,
  calculateClassPassRate,
  // Add these for compatibility with A-Level report controller
  calculateGrade,
  calculatePoints
};
