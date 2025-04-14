/**
 * Demo Form 5 Exam Results
 *
 * This file contains demo exam results for 10 Form 5 students with different subject combinations
 * for testing the Form 5 class report feature.
 */

const { calculateGradeAndPoints, calculateDivision } = require('../utils/aLevelGradeCalculator');
const demoSubjectCombinations = require('./demoSubjectCombinations');
const demoForm5Students = require('./demoForm5Students');

// Helper function to generate realistic marks
const generateMarks = (studentStrength, subjectDifficulty) => {
  // Base range for marks
  const baseMin = 35; // Minimum passing mark
  const baseMax = 95; // Maximum realistic mark

  // Adjust based on student strength (0-10 scale)
  const strengthFactor = studentStrength / 10;

  // Adjust based on subject difficulty (0-10 scale, higher means more difficult)
  const difficultyFactor = (10 - subjectDifficulty) / 10;

  // Calculate adjusted range
  const adjustedMin = baseMin + (strengthFactor * 10);
  const adjustedMax = baseMax - ((1 - strengthFactor) * 15) - (subjectDifficulty * 2);

  // Generate random mark within adjusted range
  const mark = Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;

  // Add some variability
  const variability = Math.random() * 10 - 5; // -5 to +5

  // Ensure final mark is within valid range (0-100)
  return Math.max(0, Math.min(100, Math.round(mark + variability)));
};

// Define student strengths (0-10 scale)
const studentStrengths = {
  'STU001': 8.5, // James - Strong in sciences
  'STU002': 9.0, // Maria - Exceptional student
  'STU003': 7.0, // Emmanuel - Good in social sciences
  'STU004': 8.0, // Grace - Strong in languages
  'STU005': 7.5, // Daniel - Good in math and economics
  'STU006': 7.0, // Neema - Interested in environmental sciences
  'STU007': 6.0, // Joseph - Inconsistent
  'STU008': 8.5, // Esther - Exceptional in business
  'STU009': 5.5, // Michael - Needs improvement
  'STU010': 8.0  // Rehema - Strong in medical sciences
};

// Define subject difficulties (0-10 scale)
const subjectDifficulties = {
  'PHY': 8.0,
  'CHE': 7.5,
  'MAT': 8.0,
  'BIO': 7.0,
  'GEO': 6.0,
  'HIS': 6.5,
  'ECO': 7.0,
  'KIS': 5.0,
  'LIT': 6.0,
  'COM': 6.5,
  'ACC': 7.0,
  'GS': 5.0,
  'BIT': 5.5
};

// Generate results for each student
const generateStudentResults = (student) => {
  // Find the student's combination
  const combination = demoSubjectCombinations.find(c => c.code === student.combination);
  if (!combination) return [];

  const results = [];
  const studentStrength = studentStrengths[student.id] || 7.0; // Default to 7.0 if not specified

  // Generate results for principal subjects
  combination.subjects.principal.forEach(subject => {
    const subjectDifficulty = subjectDifficulties[subject.code] || 7.0;
    const marksObtained = generateMarks(studentStrength, subjectDifficulty);
    const { grade, points } = calculateGradeAndPoints(marksObtained);

    results.push({
      studentId: student.id,
      subjectId: subject.code,
      subjectName: subject.name,
      marksObtained,
      grade,
      points,
      isPrincipal: true
    });
  });

  // Generate results for subsidiary subjects
  combination.subjects.subsidiary.forEach(subject => {
    const subjectDifficulty = subjectDifficulties[subject.code] || 5.0;
    const marksObtained = generateMarks(studentStrength, subjectDifficulty);
    const { grade, points } = calculateGradeAndPoints(marksObtained);

    results.push({
      studentId: student.id,
      subjectId: subject.code,
      subjectName: subject.name,
      marksObtained,
      grade,
      points,
      isPrincipal: false
    });
  });

  return results;
};

// Generate all results
const generateAllResults = () => {
  const allResults = [];

  demoForm5Students.forEach(student => {
    const studentResults = generateStudentResults(student);
    allResults.push({
      student,
      results: studentResults
    });
  });

  return allResults;
};

// Calculate summary statistics for each student
const calculateStudentSummaries = (allResults) => {
  return allResults.map(({ student, results }) => {
    // Calculate total and average marks
    const totalMarks = results.reduce((sum, result) => sum + result.marksObtained, 0);
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Get principal subjects
    const principalSubjects = results.filter(result => result.isPrincipal);

    // Calculate best three principal subjects (lowest points = best grades)
    const bestThreePrincipal = [...principalSubjects]
      .sort((a, b) => a.points - b.points)
      .slice(0, Math.min(3, principalSubjects.length));

    const bestThreePoints = bestThreePrincipal.reduce((sum, result) => sum + result.points, 0);

    // Calculate division based on best three points
    const division = calculateDivision(bestThreePoints);

    return {
      student,
      results,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalSubjects: results.length,
        principalSubjects: principalSubjects.length,
        bestThreePoints,
        division
      }
    };
  });
};

// Generate exam data
const demoExam = {
  id: 'EXAM001',
  name: 'Mid-Term Examination',
  type: 'MID_TERM',
  academicYear: '2023-2024',
  term: 'Term 1',
  startDate: '2023-10-15',
  endDate: '2023-10-25'
};

// Generate class data
const demoClass = {
  id: 'CLS001',
  name: 'Form 5 Science',
  section: 'A',
  stream: 'Science',
  academicYear: '2023-2024',
  form: 5,
  educationLevel: 'A_LEVEL'
};

// Generate the complete Form 5 class report
const generateForm5ClassReport = () => {
  const allResults = generateAllResults();
  const studentSummaries = calculateStudentSummaries(allResults);

  // Sort students by division and then by best three points
  studentSummaries.sort((a, b) => {
    // First sort by division (I is better than V)
    const divisionOrder = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, '0': 6 };
    const divisionDiff = divisionOrder[a.summary.division] - divisionOrder[b.summary.division];

    if (divisionDiff !== 0) return divisionDiff;

    // Then sort by best three points (lower is better)
    return a.summary.bestThreePoints - b.summary.bestThreePoints;
  });

  // Assign ranks
  studentSummaries.forEach((summary, index) => {
    summary.summary.rank = index + 1;
  });

  // Calculate class statistics
  const classAverage = studentSummaries.reduce((sum, summary) => sum + parseFloat(summary.summary.averageMarks), 0) / studentSummaries.length;

  // Count students in each division
  const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, '0': 0 };
  studentSummaries.forEach(summary => {
    divisionDistribution[summary.summary.division]++;
  });

  return {
    exam: demoExam,
    class: demoClass,
    students: studentSummaries,
    classStatistics: {
      totalStudents: studentSummaries.length,
      classAverage: classAverage.toFixed(2),
      divisionDistribution
    }
  };
};

// Export the generated report
module.exports = {
  demoExam,
  demoClass,
  demoForm5Students,
  demoSubjectCombinations,
  generateForm5ClassReport
};
