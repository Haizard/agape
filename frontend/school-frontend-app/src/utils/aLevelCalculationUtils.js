/**
 * A-Level Calculation Utilities
 *
 * This file contains utility functions for A-Level result calculations
 * based on the Tanzania's ACSEE grading system.
 */

/**
 * Calculate grade based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {string} - Grade (A, B, C, D, E, S, F)
 */
export const calculateGrade = (marks) => {
  if (marks === null || marks === undefined) {
    return '-';
  }
  
  const numMarks = Number(marks);
  if (isNaN(numMarks)) {
    return '-';
  }
  
  if (numMarks >= 80) return 'A';
  if (numMarks >= 70) return 'B';
  if (numMarks >= 60) return 'C';
  if (numMarks >= 50) return 'D';
  if (numMarks >= 40) return 'E';
  if (numMarks >= 35) return 'S';
  return 'F';
};

/**
 * Calculate points based on grade
 * @param {string} grade - Grade (A, B, C, D, E, S, F)
 * @returns {number} - Points (1-7)
 */
export const calculatePoints = (grade) => {
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'E': return 5;
    case 'S': return 6;
    case 'F': return 7;
    default: return 7;
  }
};

/**
 * Calculate A-Level division based on points
 * @param {number} points - Points from best 3 principal subjects
 * @returns {string} - Division (I, II, III, IV, 0)
 */
export const calculateDivision = (points) => {
  if (points === null || points === undefined || points === '') {
    return '0';
  }
  
  const numPoints = Number(points);
  if (isNaN(numPoints)) {
    return '0';
  }
  
  if (numPoints >= 3 && numPoints <= 9) return 'I';
  if (numPoints >= 10 && numPoints <= 12) return 'II';
  if (numPoints >= 13 && numPoints <= 17) return 'III';
  if (numPoints >= 18 && numPoints <= 19) return 'IV';
  return '0';
};

/**
 * Calculate subject GPA based on the formula:
 * Subject GPA = Sum(Number of students with each grade × Grade point value) / Total number of students
 * @param {Object} gradeDistribution - Object with grade counts (A, B, C, D, E, S, F)
 * @param {Number} totalStudents - Total number of students
 * @returns {Number} - The calculated GPA
 */
export const calculateSubjectGPA = (gradeDistribution, totalStudents) => {
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
export const calculateSubjectPassRate = (gradeDistribution, totalStudents, isPrincipal) => {
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
 * Calculate examination GPA based on the formula:
 * Method 1 (Student-based): Sum of all students' best three points / Total number of students
 * @param {Array} students - Array of students with bestThreePoints
 * @returns {Number} - The calculated examination GPA
 */
export const calculateExaminationGPA = (students) => {
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
export const calculateClassPassRate = (students) => {
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

/**
 * Calculate grade and points based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {Object} - Object with grade and points
 */
export const calculateGradeAndPoints = (marks) => {
  const grade = calculateGrade(marks);
  const points = calculatePoints(grade);
  return { grade, points };
};

/**
 * Calculate best three principal subjects and division
 * @param {Array} results - Array of subject results
 * @param {boolean} isPrincipalFn - Function to determine if a subject is principal
 * @returns {Object} - Object with bestThreePoints and division
 */
export const calculateBestThreeAndDivision = (results, isPrincipalFn = (r) => r.isPrincipal) => {
  // Filter principal subjects
  const principalResults = results.filter(isPrincipalFn);
  
  // Sort by points (ascending, since lower points are better)
  const sortedResults = [...principalResults].sort((a, b) => 
    (a.points || 7) - (b.points || 7)
  );
  
  // Take best 3 (or fewer if not enough)
  const bestThree = sortedResults.slice(0, Math.min(3, sortedResults.length));
  const bestThreePoints = bestThree.reduce((sum, r) => sum + (r.points || 7), 0);
  
  // Calculate division
  const division = calculateDivision(bestThreePoints);
  
  return { bestThree, bestThreePoints, division };
};

export default {
  calculateGrade,
  calculatePoints,
  calculateDivision,
  calculateGradeAndPoints,
  calculateBestThreeAndDivision,
  calculateSubjectGPA,
  calculateSubjectPassRate,
  calculateExaminationGPA,
  calculateClassPassRate
};
