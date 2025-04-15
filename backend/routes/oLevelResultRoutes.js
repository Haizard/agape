const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const OLevelResult = require('../models/OLevelResult');
const AcademicYear = require('../models/AcademicYear');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { generateOLevelStudentReportPDF, generateOLevelClassReportPDF } = require('../utils/oLevelReportGenerator');
const resultConsistencyChecker = require('../utils/resultConsistencyChecker');
const fs = require('node:fs');
const path = require('node:path');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');
const logger = require('../utils/logger');

// Helper function to log to file
const logToFile = (message) => {
  logger.info(message);
};

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
  logger.info('O-Level test endpoint accessed');
  res.json({ message: 'O-Level result routes are working' });
});

// Root endpoint to check if routes are registered
router.get('/', (req, res) => {
  logger.info('O-Level root endpoint accessed');
  res.json({ message: 'O-Level result routes are registered' });
});

// API endpoint for student results (JSON only, no PDF)
router.get('/api/student/:studentId/:examId', async (req, res) => {
  logger.info(`O-Level API student report requested for student ${req.params.studentId} and exam ${req.params.examId}`);
  try {
    const { studentId, examId } = req.params;

    logToFile(`GET /api/o-level-results/api/student/${studentId}/${examId} - Generating O-Level student result data`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify this is an O-Level student
    if (student.educationLevel === 'A_LEVEL') {
      logToFile(`Student ${studentId} is not an O-Level student`);
      return res.status(400).json({ message: 'This is not an O-Level student' });
    }

    // Find the exam
    const exam = await Exam.findById(examId)
      .populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      logToFile(`Class not found for student ${studentId}`);
      return res.status(404).json({ message: 'Class not found for student' });
    }

    // Get results for this student
    const results = await OLevelResult.find({ studentId, examId })
      .populate('subjectId', 'name code');

    logToFile(`Found ${results.length} results for student ${studentId}`);

    // Process results
    const subjectResults = [];
    let totalMarks = 0;
    let totalPoints = 0;
    let resultCount = 0;

    for (const result of results) {
      const subject = result.subjectId;
      if (!subject) continue;

      // Get remarks based on grade
      let remarks = '';
      switch (result.grade) {
        case 'A': remarks = 'Excellent'; break;
        case 'B': remarks = 'Very Good'; break;
        case 'C': remarks = 'Good'; break;
        case 'D': remarks = 'Satisfactory'; break;
        case 'F': remarks = 'Fail'; break;
        default: remarks = 'N/A';
      }

      subjectResults.push({
        subject: subject.name,
        code: subject.code,
        marksObtained: result.marksObtained,
        grade: result.grade,
        points: result.points,
        remarks
      });

      totalMarks += result.marksObtained;
      totalPoints += result.points;
      resultCount++;
    }

    // Calculate average marks
    const averageMarks = resultCount > 0 ? totalMarks / resultCount : 0;

    // Sort subjects by name
    subjectResults.sort((a, b) => a.subject.localeCompare(b.subject));

    // Calculate best seven subjects (lowest points = best grades)
    let bestSevenPoints = 0;
    if (subjectResults.length >= 7) {
      // Sort by points (ascending)
      const sortedResults = [...subjectResults].sort((a, b) => a.points - b.points);
      // Take best 7 subjects
      const bestSeven = sortedResults.slice(0, 7);
      bestSevenPoints = bestSeven.reduce((sum, result) => sum + result.points, 0);
    } else {
      bestSevenPoints = totalPoints;
    }

    // Calculate division based on best seven subjects
    const division = oLevelGradeCalculator.calculateDivision(bestSevenPoints);

    // Calculate grade distribution
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };

    for (const result of subjectResults) {
      if (result.grade in gradeDistribution) {
        gradeDistribution[result.grade]++;
      }
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        gender: student.gender
      },
      subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        division,
        rank: 'N/A', // Would require comparing with other students
        gradeDistribution
      },
      educationLevel: 'O_LEVEL'
    };

    // Return JSON data
    return res.json(report);
  } catch (error) {
    logToFile(`Error generating O-Level student report data: ${error.message}`);
    res.status(500).json({ message: `Error generating O-Level student report data: ${error.message}` });
  }
});

// API endpoint for class results (JSON only, no PDF)
router.get('/api/class/:classId/:examId', async (req, res) => {
  console.log(`O-Level API class report requested for class ${req.params.classId} and exam ${req.params.examId}`);
  try {
    const { classId, examId } = req.params;

    logToFile(`GET /api/o-level-results/api/class/${classId}/${examId} - Generating O-Level class result data`);

    // Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      logToFile(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find the exam
    const exam = await Exam.findById(examId)
      .populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find students in this class
    const students = await Student.find({ class: classId });
    if (students.length === 0) {
      logToFile(`No students found in class ${classId}`);
      return res.status(404).json({ message: 'No students found in this class' });
    }

    // Get all subjects for this class
    const allResults = await OLevelResult.find({ classId, examId })
      .populate('subjectId', 'name code');

    // Extract unique subjects
    const subjects = [];
    const subjectMap = new Map();
    for (const result of allResults) {
      if (result.subjectId && !subjectMap.has(result.subjectId._id.toString())) {
        subjectMap.set(result.subjectId._id.toString(), true);
        subjects.push({
          id: result.subjectId._id,
          name: result.subjectId.name,
          code: result.subjectId.code
        });
      }
    }

    // Sort subjects by name
    subjects.sort((a, b) => a.name.localeCompare(b.name));

    // Process student results
    const studentResults = [];
    let classTotal = 0;
    let classCount = 0;

    // Division summary based on NECTA standards
    const divisionSummary = {
      'I': 0,   // 7-17 points
      'II': 0,  // 18-21 points
      'III': 0, // 22-25 points
      'IV': 0,  // 26-33 points
      '0': 0    // 34+ points
    };

    // Subject analysis
    const subjectAnalysis = subjects.map(subject => ({
      name: subject.name.replace('PHYISCS', 'PHYSICS'), // Fix common typos
      code: subject.code,
      teacher: '-', // Use a dash instead of N/A for better display
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 100,
      grades: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    }));

    for (const student of students) {
      // Get results for this student
      const studentId = student._id;
      const results = await OLevelResult.find({ studentId, examId })
        .populate('subjectId', 'name code');

      if (results.length === 0) continue;

      // Process results
      const subjectResults = [];
      let totalMarks = 0;
      let totalPoints = 0;
      let resultCount = 0;

      for (const subject of subjects) {
        const result = results.find(r => r.subjectId && r.subjectId._id.toString() === subject.id.toString());

        if (result) {
          subjectResults.push({
            subject: subject.name.replace('PHYISCS', 'PHYSICS'), // Fix common typos
            code: subject.code,
            marks: result.marksObtained,
            grade: result.grade,
            points: result.points
          });

          totalMarks += result.marksObtained;
          totalPoints += result.points;
          resultCount++;

          // Update subject analysis
          const subjectIndex = subjectAnalysis.findIndex(s => s.name === subject.name);
          if (subjectIndex !== -1) {
            const analysis = subjectAnalysis[subjectIndex];
            analysis.averageMarks += result.marksObtained;
            analysis.highestMarks = Math.max(analysis.highestMarks, result.marksObtained);
            analysis.lowestMarks = Math.min(analysis.lowestMarks, result.marksObtained);
            if (analysis.grades[result.grade] !== undefined) {
              analysis.grades[result.grade]++;
            }
          }
        } else {
          subjectResults.push({
            subject: subject.name,
            code: subject.code,
            marks: 0,
            grade: 'N/A',
            points: 0
          });
        }
      }

      // Calculate average marks
      const averageMarks = resultCount > 0 ? totalMarks / resultCount : 0;

      // Calculate best seven subjects (lowest points = best grades)
      let bestSevenPoints = 0;
      if (subjectResults.length >= 7) {
        // Sort by points (ascending)
        const sortedResults = [...subjectResults]
          .filter(r => r.grade !== 'N/A')
          .sort((a, b) => a.points - b.points);
        // Take best 7 subjects
        const bestSeven = sortedResults.slice(0, 7);
        bestSevenPoints = bestSeven.reduce((sum, result) => sum + result.points, 0);
      } else {
        bestSevenPoints = totalPoints;
      }

      // Calculate division based on best seven subjects
      const division = oLevelGradeCalculator.calculateDivision(bestSevenPoints);

      // Update division summary
      if (divisionSummary[division] !== undefined) {
        divisionSummary[division]++;
      }

      studentResults.push({
        id: studentId,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        results: subjectResults,
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        division
      });

      classTotal += averageMarks;
      classCount++;
    }

    // Calculate class average
    const classAverage = classCount > 0 ? classTotal / classCount : 0;

    // Sort students by average marks (descending) and assign ranks
    studentResults.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));
    studentResults.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Finalize subject analysis
    for (const subject of subjectAnalysis) {
      const totalStudents = Object.values(subject.grades).reduce((sum, count) => sum + count, 0);
      if (totalStudents > 0) {
        subject.averageMarks = subject.averageMarks / totalStudents;
      }
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Class Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      subjects,
      students: studentResults,
      subjectAnalysis,
      classAverage: classAverage.toFixed(2),
      divisionSummary,
      passRate: 0, // Would need to calculate based on passing criteria
      totalStudents: students.length,
      educationLevel: 'O_LEVEL'
    };

    // Return JSON data
    return res.json(report);
  } catch (error) {
    logToFile(`Error generating O-Level class report data: ${error.message}`);
    res.status(500).json({ message: `Error generating O-Level class report data: ${error.message}` });
  }
});

// Get student result report
// Temporarily removing authentication for testing
// router.get('/student/:studentId/:examId', authenticateToken, async (req, res) => {
router.get('/student/:studentId/:examId', async (req, res) => {
  console.log(`O-Level student report requested for student ${req.params.studentId} and exam ${req.params.examId}`);
  console.log('Request headers:', req.headers);
  console.log('Request query:', req.query);
  console.log('Request params:', req.params);
  try {
    const { studentId, examId } = req.params;

    logToFile(`GET /api/o-level-results/student/${studentId}/${examId} - Generating O-Level student result report`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify this is an O-Level student
    if (student.educationLevel === 'A_LEVEL') {
      logToFile(`Student ${studentId} is not an O-Level student`);
      return res.status(400).json({ message: 'This is not an O-Level student' });
    }

    // Find the exam
    const exam = await Exam.findById(examId)
      .populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      logToFile(`Class not found for student ${studentId}`);
      return res.status(404).json({ message: 'Class not found for student' });
    }

    // Get results for this student
    const results = await OLevelResult.find({ studentId, examId })
      .populate('subjectId', 'name code');

    logToFile(`Found ${results.length} results for student ${studentId}`);

    // Process results
    const subjectResults = [];
    let totalMarks = 0;
    let totalPoints = 0;
    let resultCount = 0;

    for (const result of results) {
      const subject = result.subjectId;
      if (!subject) continue;

      // Get remarks based on grade
      let remarks = '';
      switch (result.grade) {
        case 'A': remarks = 'Excellent'; break;
        case 'B': remarks = 'Very Good'; break;
        case 'C': remarks = 'Good'; break;
        case 'D': remarks = 'Satisfactory'; break;
        case 'F': remarks = 'Fail'; break;
        default: remarks = 'N/A';
      }

      subjectResults.push({
        subject: subject.name.replace('PHYISCS', 'PHYSICS'), // Fix common typos
        code: subject.code,
        marks: result.marksObtained,
        grade: result.grade,
        points: result.points,
        remarks
      });

      totalMarks += result.marksObtained;
      totalPoints += result.points;
      resultCount++;
    }

    // Calculate average marks
    const averageMarks = resultCount > 0 ? totalMarks / resultCount : 0;

    // Sort subjects by name
    subjectResults.sort((a, b) => a.subject.localeCompare(b.subject));

    // Calculate best seven subjects (lowest points = best grades)
    let bestSevenPoints = 0;
    if (subjectResults.length >= 7) {
      // Sort by points (ascending)
      const sortedResults = [...subjectResults].sort((a, b) => a.points - b.points);
      // Take best 7 subjects
      const bestSeven = sortedResults.slice(0, 7);
      bestSevenPoints = bestSeven.reduce((sum, result) => sum + result.points, 0);
    } else {
      bestSevenPoints = totalPoints;
    }

    // Calculate division based on best seven subjects
    const division = oLevelGradeCalculator.calculateDivision(bestSevenPoints);

    // Calculate grade distribution
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };

    for (const result of subjectResults) {
      if (result.grade in gradeDistribution) {
        gradeDistribution[result.grade]++;
      }
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        gender: student.gender
      },
      subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        division,
        rank: 'N/A', // Would require comparing with other students
        gradeDistribution
      }
    };

    // Return JSON data for API requests
    if (req.headers.accept?.includes('application/json')) {
      logger.info('Returning JSON data for API request');
      return res.json({
        ...report,
        educationLevel: 'O_LEVEL'
      });
    }

    // Generate PDF for browser requests
    generateOLevelStudentReportPDF(report, res);
  } catch (error) {
    logToFile(`Error generating O-Level student report: ${error.message}`);
    res.status(500).json({ message: `Error generating O-Level student report: ${error.message}` });
  }
});

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
  console.log('O-Level test endpoint accessed');
  res.json({ message: 'O-Level result routes are working' });
});

// Root endpoint to check if routes are registered
router.get('/', (req, res) => {
  console.log('O-Level root endpoint accessed');
  res.json({ message: 'O-Level result routes are registered' });
});

// Test endpoint without authentication
router.get('/test-no-auth/:studentId/:examId', (req, res) => {
  console.log(`O-Level test endpoint accessed for student ${req.params.studentId} and exam ${req.params.examId}`);
  res.json({ message: 'O-Level result routes are working without authentication', params: req.params });
});

// Get class result report
router.get('/class/:classId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;

    logToFile(`GET /api/o-level-results/class/${classId}/${examId} - Generating O-Level class result report`);

    // Get class details
    const classObj = await Class.findById(classId)
      .populate('students')
      .populate({
        path: 'subjects.subject',
        model: 'Subject'
      })
      .populate('academicYear')
      .populate('classTeacher');

    if (!classObj) {
      logToFile(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify this is an O-Level class
    if (classObj.educationLevel === 'A_LEVEL') {
      logToFile(`Class ${classId} is not an O-Level class`);
      return res.status(400).json({ message: 'This is not an O-Level class' });
    }

    // Find the exam
    const exam = await Exam.findById(examId)
      .populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get all students in the class
    const students = classObj.students || [];
    if (students.length === 0) {
      logToFile(`No students found in class ${classId}`);
      return res.status(404).json({ message: 'No students found in class' });
    }

    // Process results for each student
    const studentResults = [];
    let classTotal = 0;
    let classCount = 0;

    for (const student of students) {
      // Get results for this student
      const results = await OLevelResult.find({ studentId: student._id, examId })
        .populate('subjectId', 'name code');

      // Process student results
      const subjectResults = [];
      let studentTotal = 0;
      let studentPoints = 0;
      let resultCount = 0;

      for (const result of results) {
        const subject = result.subjectId;
        if (!subject) continue;

        subjectResults.push({
          subject: subject.name,
          code: subject.code,
          marks: result.marksObtained,
          grade: result.grade,
          points: result.points
        });

        studentTotal += result.marksObtained;
        studentPoints += result.points;
        resultCount++;
      }

      // Calculate student average
      const studentAverage = resultCount > 0 ? studentTotal / resultCount : 0;
      classTotal += studentAverage;
      classCount++;

      // Calculate best seven subjects (lowest points = best grades)
      let bestSevenPoints = 0;
      if (subjectResults.length >= 7) {
        // Sort by points (ascending)
        const sortedResults = [...subjectResults].sort((a, b) => a.points - b.points);
        // Take best 7 subjects
        const bestSeven = sortedResults.slice(0, 7);
        bestSevenPoints = bestSeven.reduce((sum, result) => sum + result.points, 0);
      } else {
        bestSevenPoints = studentPoints;
      }

      // Calculate division based on best seven subjects
      const division = oLevelGradeCalculator.calculateDivision(bestSevenPoints);

      // Add student result summary
      studentResults.push({
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        sex: student.gender === 'male' ? 'M' : 'F',
        results: subjectResults,
        totalMarks: studentTotal,
        averageMarks: studentAverage.toFixed(2),
        totalPoints: studentPoints,
        bestSevenPoints,
        division,
        rank: 'N/A' // Will be calculated below
      });
    }

    // Calculate class average
    const classAverage = classCount > 0 ? classTotal / classCount : 0;

    // Sort students by average marks (descending) and assign ranks
    studentResults.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));
    studentResults.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Format the report
    const report = {
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      academicYear: classObj.academicYear ? classObj.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      students: studentResults,
      classAverage,
      totalStudents: students.length,
      educationLevel: 'O_LEVEL'
    };

    // Return JSON data for API requests
    if (req.headers.accept?.includes('application/json')) {
      logger.info('Returning JSON data for API request');
      return res.json({
        ...report,
        educationLevel: 'O_LEVEL'
      });
    }

    // Generate PDF for browser requests
    generateOLevelClassReportPDF(report, res);
  } catch (error) {
    logToFile(`Error generating O-Level class report: ${error.message}`);
    res.status(500).json({ message: `Error generating O-Level class report: ${error.message}` });
  }
});

module.exports = router;
