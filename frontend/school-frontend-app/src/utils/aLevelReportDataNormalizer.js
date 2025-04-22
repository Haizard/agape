/**
 * A-Level Report Data Normalizer
 *
 * Utility functions to normalize A-Level report data from the API
 * to ensure consistent structure for the frontend components.
 */

/**
 * Normalize A-Level class report data
 * @param {Object} data - Raw API response data
 * @returns {Object} - Normalized data
 */
export const normalizeALevelClassReport = (data) => {
  if (!data) return null;

  // Ensure students array exists
  const students = Array.isArray(data.students) ? data.students : [];

  // Normalize student data
  const normalizedStudents = students.map(student => normalizeStudentData(student));

  // Calculate division distribution if not provided
  const divisionDistribution = data.divisionDistribution || calculateDivisionDistribution(normalizedStudents);

  // Calculate class average if not provided or ensure it's a number
  let classAverage = data.classAverage;
  if (classAverage === undefined || classAverage === null) {
    classAverage = calculateClassAverage(normalizedStudents);
  } else if (typeof classAverage === 'string') {
    // Convert string to number
    classAverage = parseFloat(classAverage) || 0;
  }

  // Return normalized data
  return {
    ...data,
    students: normalizedStudents,
    divisionDistribution,
    classAverage,
    totalStudents: data.totalStudents || normalizedStudents.length,
    absentStudents: data.absentStudents || 0,
    educationLevel: data.educationLevel || 'A_LEVEL'
  };
};

/**
 * Normalize student data in class report
 * @param {Object} student - Raw student data
 * @returns {Object} - Normalized student data
 */
const normalizeStudentData = (student) => {
  if (!student) return null;

  // Ensure results array exists
  const results = Array.isArray(student.results) ? student.results : [];

  // Normalize results
  const normalizedResults = results.map(result => {
    // Log the result structure to help debug
    console.log('A-Level normalizer - Subject result structure:', {
      subject: result.subject,
      marks: result.marks,
      marksObtained: result.marksObtained,
      score: result.score,
      grade: result.grade,
      points: result.points
    });

    return {
      subject: result.subject || '',
      code: result.code || '',
      // Try all possible property names for marks
      marks: result.marks || result.marksObtained || result.score || 0,
      grade: result.grade || '-',
      points: result.points || 0,
      remarks: result.remarks || '',
      isPrincipal: result.isPrincipal || false,
      isCompulsory: result.isCompulsory || false
    };
  });

  // Calculate total marks if not provided
  const totalMarks = student.totalMarks || normalizedResults.reduce((sum, result) => sum + (parseFloat(result.marks) || 0), 0);

  // Calculate average marks if not provided
  const averageMarks = student.averageMarks || (normalizedResults.length > 0 ? (totalMarks / normalizedResults.length).toFixed(2) : '0.00');

  // Return normalized student data
  return {
    id: student.id || student._id || '',
    name: student.name || '',
    rollNumber: student.rollNumber || '',
    sex: student.sex || student.gender || '',
    results: normalizedResults,
    totalMarks,
    averageMarks,
    totalPoints: student.totalPoints || calculateTotalPoints(normalizedResults),
    bestThreePoints: student.bestThreePoints || calculateBestThreePoints(normalizedResults),
    division: student.division || calculateDivision(student.bestThreePoints || calculateBestThreePoints(normalizedResults)),
    rank: student.rank || 0
  };
};

/**
 * Calculate total points from results
 * @param {Array} results - Student results
 * @returns {number} - Total points
 */
const calculateTotalPoints = (results) => {
  return results.reduce((sum, result) => sum + (parseInt(result.points) || 0), 0);
};

/**
 * Calculate best three points from results
 * @param {Array} results - Student results
 * @returns {number} - Best three points
 */
const calculateBestThreePoints = (results) => {
  // Filter principal subjects
  const principalSubjects = results.filter(result => result.isPrincipal);

  // Sort by points (ascending)
  const sortedSubjects = [...principalSubjects].sort((a, b) => (parseInt(a.points) || 0) - (parseInt(b.points) || 0));

  // Take best three (lowest points)
  const bestThree = sortedSubjects.slice(0, 3);

  // Sum points
  return bestThree.reduce((sum, result) => sum + (parseInt(result.points) || 0), 0);
};

/**
 * Calculate division based on points
 * @param {number} points - Best three points
 * @returns {string} - Division
 */
const calculateDivision = (points) => {
  if (points <= 9) return 'I';
  if (points <= 12) return 'II';
  if (points <= 14) return 'III';
  if (points <= 17) return 'IV';
  return '0';
};

/**
 * Calculate division distribution from students
 * @param {Array} students - Normalized students
 * @returns {Object} - Division distribution
 */
const calculateDivisionDistribution = (students) => {
  const distribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };

  students.forEach(student => {
    if (student.division) {
      const divKey = student.division.toString().replace('Division ', '');
      distribution[divKey] = (distribution[divKey] || 0) + 1;
    }
  });

  return distribution;
};

/**
 * Calculate class average from students
 * @param {Array} students - Normalized students
 * @returns {number} - Class average
 */
const calculateClassAverage = (students) => {
  if (students.length === 0) return 0;

  const totalAverage = students.reduce((sum, student) => {
    // Ensure we're adding a number
    const avgMarks = typeof student.averageMarks === 'string'
      ? parseFloat(student.averageMarks)
      : (typeof student.averageMarks === 'number' ? student.averageMarks : 0);
    return sum + (avgMarks || 0);
  }, 0);

  // Return as a number, not a string
  return parseFloat((totalAverage / students.length).toFixed(2));
};

export default {
  normalizeALevelClassReport
};
