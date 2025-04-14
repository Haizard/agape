/**
 * Demo Data Routes
 *
 * This file contains routes for serving demo data for testing purposes.
 * These routes mirror the actual API endpoints but serve demo data instead.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');
const { generateForm5ClassReport, demoExam, demoClass, demoForm5Students } = require('../data/demoForm5Results');
const demoSubjectCombinations = require('../data/demoSubjectCombinations');
const logger = require('../utils/logger');

// Middleware to log demo data access
const logDemoAccess = (req, res, next) => {
  logger.info(`Demo data accessed: ${req.method} ${req.originalUrl}`);
  next();
};

router.use(logDemoAccess);

// Get demo classes
router.get('/classes', authenticateToken, (req, res) => {
  try {
    // Return the demo class in the format expected by the frontend
    return res.json([{
      _id: demoClass.id,
      name: demoClass.name,
      section: demoClass.section,
      stream: demoClass.stream,
      academicYear: demoClass.academicYear,
      form: demoClass.form,
      educationLevel: demoClass.educationLevel
    }]);
  } catch (error) {
    logger.error(`Error retrieving demo classes: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/classes'));
  }
});

// Get demo exams
router.get('/exams', authenticateToken, (req, res) => {
  try {
    // Check if class filter is applied
    const classId = req.query.class;

    // If class filter is applied and it doesn't match our demo class, return empty array
    if (classId && classId !== demoClass.id) {
      return res.json([]);
    }

    // Return the demo exam in the format expected by the frontend
    return res.json([{
      _id: demoExam.id,
      name: demoExam.name,
      type: demoExam.type,
      academicYear: demoExam.academicYear,
      term: demoExam.term,
      startDate: demoExam.startDate,
      endDate: demoExam.endDate
    }]);
  } catch (error) {
    logger.error(`Error retrieving demo exams: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/exams'));
  }
});

// Get demo students
router.get('/students', authenticateToken, (req, res) => {
  try {
    // Check if class filter is applied
    const classId = req.query.class;

    // If class filter is applied and it doesn't match our demo class, return empty array
    if (classId && classId !== demoClass.id) {
      return res.json([]);
    }

    // Format students as expected by the frontend
    const formattedStudents = demoForm5Students.map(student => ({
      _id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber,
      gender: student.gender,
      form: student.form,
      educationLevel: student.educationLevel,
      class: demoClass.id,
      subjectCombination: student.combination
    }));

    return res.json(formattedStudents);
  } catch (error) {
    logger.error(`Error retrieving demo students: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/students'));
  }
});

// Get a specific demo student
router.get('/students/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const student = demoForm5Students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json(formatErrorResponse(new Error('Student not found'), 'demo/students/:id'));
    }

    // Format student as expected by the frontend
    const formattedStudent = {
      _id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber,
      gender: student.gender,
      form: student.form,
      educationLevel: student.educationLevel,
      class: demoClass.id,
      subjectCombination: student.combination,
      characterAssessment: student.characterAssessment
    };

    return res.json(formattedStudent);
  } catch (error) {
    logger.error(`Error retrieving demo student: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/students/:id'));
  }
});

// Get demo subject combinations
router.get('/subject-combinations', authenticateToken, (req, res) => {
  try {
    // Format subject combinations as expected by the frontend
    const formattedCombinations = demoSubjectCombinations.map(combo => ({
      _id: combo.code,
      code: combo.code,
      name: combo.name,
      description: combo.description,
      principalSubjects: combo.subjects.principal.map(s => s.code),
      subsidiarySubjects: combo.subjects.subsidiary.map(s => s.code),
      educationLevel: 'A_LEVEL'
    }));

    return res.json(formattedCombinations);
  } catch (error) {
    logger.error(`Error retrieving demo subject combinations: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/subject-combinations'));
  }
});

// Get demo subjects
router.get('/subjects', authenticateToken, (req, res) => {
  try {
    // Extract all subjects from combinations
    const allSubjects = [];

    demoSubjectCombinations.forEach(combo => {
      combo.subjects.principal.forEach(subject => {
        if (!allSubjects.some(s => s.code === subject.code)) {
          allSubjects.push({
            _id: subject.code,
            name: subject.name,
            code: subject.code,
            isPrincipal: true,
            educationLevel: 'A_LEVEL'
          });
        }
      });

      combo.subjects.subsidiary.forEach(subject => {
        if (!allSubjects.some(s => s.code === subject.code)) {
          allSubjects.push({
            _id: subject.code,
            name: subject.name,
            code: subject.code,
            isPrincipal: false,
            educationLevel: 'A_LEVEL'
          });
        }
      });
    });

    return res.json(allSubjects);
  } catch (error) {
    logger.error(`Error retrieving demo subjects: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/subjects'));
  }
});

// Get A-Level Form 5 class report
router.get('/a-level-results/form5/class/:classId/:examId', authenticateToken, (req, res) => {
  try {
    const { classId, examId } = req.params;

    // Check if the requested class and exam match our demo data
    if (classId !== demoClass.id || examId !== demoExam.id) {
      return res.status(404).json(formatErrorResponse(
        new Error('Class or exam not found'),
        'demo/a-level-results/form5/class'
      ));
    }

    // Generate the class report
    const report = generateForm5ClassReport();

    // Format the response as expected by the frontend
    const formattedResponse = {
      reportTitle: `Form 5 ${report.exam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: report.exam.academicYear || '2023-2024',
      examName: report.exam.name,
      examDate: `${report.exam.startDate} - ${report.exam.endDate}`,
      className: report.class.name,
      section: report.class.section,
      stream: report.class.stream,
      form: 5,
      students: report.students.map(item => ({
        id: item.student.id,
        name: `${item.student.firstName} ${item.student.lastName}`,
        rollNumber: item.student.rollNumber,
        gender: item.student.gender,
        combination: item.student.combination,
        averageMarks: item.summary.averageMarks,
        totalMarks: item.summary.totalMarks,
        bestThreePoints: item.summary.bestThreePoints,
        division: item.summary.division,
        rank: item.summary.rank,
        subjectResults: item.results.map(result => ({
          subject: result.subjectName,
          code: result.subjectId,
          marks: result.marksObtained,
          grade: result.grade,
          points: result.points,
          isPrincipal: result.isPrincipal
        }))
      })),
      classAverage: report.classStatistics.classAverage,
      totalStudents: report.classStatistics.totalStudents,
      divisionDistribution: report.classStatistics.divisionDistribution,
      educationLevel: 'A_LEVEL'
    };

    return res.json(formattedResponse);
  } catch (error) {
    logger.error(`Error generating demo Form 5 class report: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/a-level-results/form5/class'));
  }
});

// Special route for demo class report page
router.get('/results/class-report/demo-class/demo-exam', authenticateToken, (req, res) => {
  try {
    logger.info('Demo class report page accessed');

    // Generate the class report
    const report = generateForm5ClassReport();

    // Format the response as expected by the ClassTabularReport component
    const formattedResponse = {
      reportTitle: `Form 5 ${report.exam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: '2023-2024',
      examName: report.exam.name,
      examDate: `${report.exam.startDate} - ${report.exam.endDate}`,
      className: report.class.name,
      section: report.class.section,
      stream: report.class.stream,
      form: 5,
      classDetails: {
        name: report.class.name,
        section: report.class.section,
        stream: report.class.stream,
        totalStudents: report.students.length,
        classTeacher: 'Mr. John Doe'
      },
      summary: {
        classAverage: report.classStatistics.classAverage,
        totalStudents: report.classStatistics.totalStudents,
        divisionDistribution: report.classStatistics.divisionDistribution,
        passRate: '85%'
      },
      students: report.students.map(item => ({
        id: item.student.id,
        name: `${item.student.firstName} ${item.student.lastName}`,
        rollNumber: item.student.rollNumber,
        gender: item.student.gender,
        combination: item.student.combination,
        averageMarks: item.summary.averageMarks,
        totalMarks: item.summary.totalMarks,
        bestThreePoints: item.summary.bestThreePoints,
        division: item.summary.division,
        rank: item.summary.rank,
        subjectResults: item.results.map(result => ({
          subject: result.subjectName,
          code: result.subjectId,
          marks: result.marksObtained,
          grade: result.grade,
          points: result.points,
          isPrincipal: result.isPrincipal
        }))
      })),
      educationLevel: 'A_LEVEL'
    };

    return res.json(formattedResponse);
  } catch (error) {
    logger.error(`Error generating demo class report page: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/results/class-report'));
  }
});

// Get A-Level Form 5 student report
router.get('/a-level-results/form5/student/:studentId/:examId', authenticateToken, (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // Check if the requested exam matches our demo data
    if (examId !== demoExam.id) {
      return res.status(404).json(formatErrorResponse(
        new Error('Exam not found'),
        'demo/a-level-results/form5/student'
      ));
    }

    // Find the student
    const student = demoForm5Students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json(formatErrorResponse(
        new Error('Student not found'),
        'demo/a-level-results/form5/student'
      ));
    }

    // Generate the class report to get the student's results
    const classReport = generateForm5ClassReport();
    const studentData = classReport.students.find(item => item.student.id === studentId);

    if (!studentData) {
      return res.status(404).json(formatErrorResponse(
        new Error('Student results not found'),
        'demo/a-level-results/form5/student'
      ));
    }

    // Find the student's combination
    const combination = demoSubjectCombinations.find(c => c.code === student.combination);

    // Format the response as expected by the frontend
    const formattedResponse = {
      reportTitle: `Form 5 ${demoExam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: demoExam.academicYear || '2023-2024',
      examName: demoExam.name,
      examDate: `${demoExam.startDate} - ${demoExam.endDate}`,
      studentDetails: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${demoClass.name} ${demoClass.section || ''} ${demoClass.stream || ''}`.trim(),
        gender: student.gender,
        form: student.form
      },
      subjectResults: studentData.results.map(result => ({
        subject: result.subjectName,
        code: result.subjectId,
        marks: result.marksObtained,
        grade: result.grade,
        points: result.points,
        isPrincipal: result.isPrincipal,
        remarks: getRemarks(result.grade)
      })),
      principalSubjects: studentData.results.filter(r => r.isPrincipal).map(result => ({
        subject: result.subjectName,
        code: result.subjectId,
        marks: result.marksObtained,
        grade: result.grade,
        points: result.points,
        isPrincipal: true,
        remarks: getRemarks(result.grade)
      })),
      subsidiarySubjects: studentData.results.filter(r => !r.isPrincipal).map(result => ({
        subject: result.subjectName,
        code: result.subjectId,
        marks: result.marksObtained,
        grade: result.grade,
        points: result.points,
        isPrincipal: false,
        remarks: getRemarks(result.grade)
      })),
      summary: {
        totalMarks: studentData.summary.totalMarks,
        averageMarks: studentData.summary.averageMarks,
        totalPoints: studentData.results.reduce((sum, r) => sum + r.points, 0),
        bestThreePoints: studentData.summary.bestThreePoints,
        division: studentData.summary.division,
        rank: studentData.summary.rank,
        totalStudents: classReport.classStatistics.totalStudents,
        gradeDistribution: calculateGradeDistribution(studentData.results)
      },
      subjectCombination: combination ? {
        code: combination.code,
        name: combination.name,
        description: combination.description,
        principalSubjects: combination.subjects.principal.map(s => ({
          code: s.code,
          name: s.name
        })),
        subsidiarySubjects: combination.subjects.subsidiary.map(s => ({
          code: s.code,
          name: s.name
        }))
      } : null,
      characterAssessment: student.characterAssessment,
      form: 5,
      educationLevel: 'A_LEVEL'
    };

    return res.json(formattedResponse);
  } catch (error) {
    logger.error(`Error generating demo Form 5 student report: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'demo/a-level-results/form5/student'));
  }
});

// Helper function to get remarks based on grade
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

// Helper function to calculate grade distribution
function calculateGradeDistribution(results) {
  const distribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 };

  for (const result of results) {
    if (distribution[result.grade] !== undefined) {
      distribution[result.grade]++;
    }
  }

  return distribution;
}

module.exports = router;
