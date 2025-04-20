/**
 * O-Level Grade Calculator
 *
 * This utility provides grade calculation functions specifically for O-Level (Form 1-4)
 * following Tanzania's CSEE grading system.
 */
const logger = require('./logger');

/**
 * Calculate grade and points based on marks for O-Level
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
    logger.warn(`Invalid marks value for O-Level: ${marks}`);
    return { grade: '-', points: 0 };
  }

  // O-LEVEL grading based on Tanzania's NECTA CSEE system
  let grade, points;

  if (numMarks >= 75) {
    grade = 'A';
    points = 1;
  } else if (numMarks >= 65) {
    grade = 'B';
    points = 2;
  } else if (numMarks >= 45) {
    grade = 'C';
    points = 3;
  } else if (numMarks >= 30) {
    grade = 'D';
    points = 4;
  } else {
    grade = 'F';
    points = 5;
  }

  return { grade, points };
};

/**
 * Calculate O-Level division based on points from best 7 subjects
 * @param {Number} points - Total points from best 7 subjects
 * @returns {String} - Division (I, II, III, IV, 0)
 */
const calculateDivision = (points) => {
  // Handle edge cases
  if (points === undefined || points === null || Number.isNaN(Number(points))) {
    logger.warn(`Invalid points value for O-Level division calculation: ${points}`);
    return '0';
  }

  // Convert to number
  const numPoints = Number(points);

  // Calculate division based on Tanzania's NECTA CSEE system
  if (numPoints >= 7 && numPoints <= 17) return 'I';
  if (numPoints >= 18 && numPoints <= 21) return 'II';
  if (numPoints >= 22 && numPoints <= 25) return 'III';
  if (numPoints >= 26 && numPoints <= 33) return 'IV';
  return '0';
};

/**
 * Get remarks based on grade for O-Level
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {String} - The remarks
 */
const getRemarks = (grade) => {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'F': return 'Fail';
    default: return '-';
  }
};

/**
 * Calculate best seven subjects and division for O-Level
 * @param {Array} results - Array of subject results
 * @returns {Object} - Object containing bestSevenResults, bestSevenPoints, and division
 */
const calculateBestSevenAndDivision = (results) => {
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

  // Filter out results with no marks or grades
  const validResults = resultsWithPoints.filter(result => {
    // Check if the result has valid marks or grade
    return (
      (result.marksObtained > 0 || result.marks > 0) &&
      result.grade !== '-'
    );
  });

  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...validResults].sort((a, b) => (a.points || 5) - (b.points || 5));

  // Take the best 7 subjects (or all if less than 7)
  const bestSevenResults = sortedResults.slice(0, Math.min(7, sortedResults.length));

  // Calculate total points from best subjects
  const bestSevenPoints = bestSevenResults.reduce((sum, result) => sum + (result.points || 5), 0);

  // Log for debugging
  logger.debug('O-Level division calculation:', {
    totalResults: resultsWithPoints.length,
    validResults: validResults.length,
    bestSevenResults: bestSevenResults.map(r => ({
      name: r.name || r.subject?.name || r.subjectId?.name || 'Unknown',
      marks: r.marksObtained || r.marks,
      grade: r.grade,
      points: r.points
    })),
    bestSevenPoints
  });

  // Calculate division based on total points
  const division = calculateDivision(bestSevenPoints);

  return {
    bestSevenResults,
    bestSevenPoints,
    division
  };
};

/**
 * Calculate student rankings based on average marks or points for O-Level
 * @param {Array} students - Array of students with results
 * @param {String} rankBy - Field to rank by ('averageMarks' or 'totalPoints')
 * @returns {Array} - Array of students with rank property added
 */
const calculateStudentRankings = (students, rankBy = 'averageMarks') => {
  // Sort students by the ranking field
  const sortedStudents = [...students].sort((a, b) => {
    // For points, lower is better
    if (rankBy === 'totalPoints' || rankBy === 'bestSevenPoints') {
      return (a[rankBy] || 0) - (b[rankBy] || 0);
    }
    // For marks, higher is better
    return (b[rankBy] || 0) - (a[rankBy] || 0);
  });

  // Assign ranks (handling ties)
  let currentRank = 1;
  let previousValue = null;
  let skippedRanks = 0;

  return sortedStudents.map((student, index) => {
    const currentValue = student[rankBy] || 0;

    // If this is the first student or the value is different from the previous one
    if (index === 0 || currentValue !== previousValue) {
      currentRank = index + 1;
      skippedRanks = 0;
    } else {
      // This is a tie, so keep the same rank but increment skipped ranks
      skippedRanks++;
    }

    previousValue = currentValue;

    return {
      ...student,
      rank: currentRank
    };
  });
};

/**
 * Calculate subject positions for a class
 * @param {Array} students - Array of students with results
 * @returns {Object} - Object mapping subject IDs to arrays of student positions
 */
const calculateSubjectPositions = (students) => {
  // Create a map of subject IDs to arrays of student results
  const subjectMap = {};

  // Populate the subject map
  students.forEach(student => {
    (student.results || []).forEach(result => {
      const subjectId = result.subjectId || result.subject?._id || 'unknown';
      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = [];
      }
      subjectMap[subjectId].push({
        studentId: student._id || student.id,
        marks: result.marksObtained || result.marks || 0
      });
    });
  });

  // Calculate positions for each subject
  const subjectPositions = {};

  Object.entries(subjectMap).forEach(([subjectId, results]) => {
    // Sort results by marks (descending)
    const sortedResults = [...results].sort((a, b) => b.marks - a.marks);

    // Assign positions
    let currentPosition = 1;
    let previousMarks = null;
    let skipCount = 0;

    const positionsArray = sortedResults.map((result, index) => {
      const currentMarks = result.marks;

      // If this is the first result or the marks are different from the previous one
      if (index === 0 || currentMarks !== previousMarks) {
        currentPosition = index + 1;
        skipCount = 0;
      } else {
        skipCount++;
      }

      previousMarks = currentMarks;

      return {
        studentId: result.studentId,
        position: currentPosition
      };
    });

    subjectPositions[subjectId] = positionsArray;
  });

  return subjectPositions;
};

/**
 * Calculate class statistics for a set of O-Level results
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
 * Calculate grade based on marks for O-Level
 * @param {Number} marks - The marks obtained (0-100)
 * @returns {String} - The grade (A, B, C, D, F)
 */
const calculateGrade = (marks) => {
  // Validate inputs
  if (marks === undefined || marks === null) {
    return '-';
  }

  // Convert to number if string
  const numMarks = Number(marks);

  // Check for NaN
  if (Number.isNaN(numMarks)) {
    logger.warn(`Invalid marks value for O-Level grade calculation: ${marks}`);
    return '-';
  }

  // O-LEVEL grading based on Tanzania's NECTA CSEE system
  if (numMarks >= 75) return 'A';
  if (numMarks >= 65) return 'B';
  if (numMarks >= 45) return 'C';
  if (numMarks >= 30) return 'D';
  return 'F';
};

/**
 * Calculate points based on grade for O-Level
 * @param {String} grade - The grade (A, B, C, D, F)
 * @returns {Number} - The points (1-5)
 */
const calculatePoints = (grade) => {
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'F': return 5;
    default: return 0;
  }
};

module.exports = {
  calculateGradeAndPoints,
  calculateGrade,
  calculatePoints,
  calculateDivision,
  getRemarks,
  calculateBestSevenAndDivision,
  calculateStudentRankings,
  calculateSubjectPositions,
  calculateClassStatistics
};
