const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const ALevelResult = require('../models/ALevelResult');
const OLevelResult = require('../models/OLevelResult');
const AcademicYear = require('../models/AcademicYear');
const CharacterAssessment = require('../models/CharacterAssessment');
const SubjectCombination = require('../models/SubjectCombination');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { generateALevelComprehensiveReportPDF } = require('../utils/aLevelComprehensiveReportGenerator');
const fs = require('fs');
const path = require('path');

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `comprehensive_reports_${new Date().toISOString().split('T')[0]}.log`);
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

/**
 * Get comprehensive student report
 * This endpoint serves as a unified entry point for both A-Level and O-Level reports
 * It detects the education level and redirects to the appropriate handler
 */
router.get('/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { academicYear, term } = req.query;

    logToFile(`GET /api/results/comprehensive/student/${studentId}/${examId} - Generating comprehensive report`);

    // Find the student
    const student = await Student.findById(studentId).populate('class');

    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the class to determine education level
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      logToFile(`Class not found for student ${studentId}`);
      return res.status(404).json({ message: 'Class not found for student' });
    }

    // Determine education level
    const educationLevel = student.educationLevel || classObj.educationLevel || 'O_LEVEL';

    logToFile(`Student ${studentId} education level: ${educationLevel}`);

    // Redirect to the appropriate handler based on education level
    if (educationLevel === 'A_LEVEL') {
      logToFile(`Redirecting to A-Level comprehensive report handler for student ${studentId}`);
      return generateALevelReport(req, res, student, examId, academicYear, term);
    } else {
      logToFile(`Redirecting to O-Level comprehensive report handler for student ${studentId}`);
      return generateOLevelReport(req, res, student, examId, academicYear, term);
    }
  } catch (error) {
    logToFile(`Error in comprehensive report router: ${error.message}`);
    console.error('Error in comprehensive report router:', error);
    res.status(500).json({
      message: `Error generating comprehensive report: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate A-Level comprehensive report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} student - Student document
 * @param {String} examId - Exam ID
 * @param {String} academicYear - Academic year ID or "current"
 * @param {String} term - Term name or "current"
 */
async function generateALevelReport(req, res, student, examId, academicYear, term) {
  try {
    logToFile(`Generating A-Level report for student ${student._id} and exam ${examId}`);

    // Find the student with subject combination
    const studentWithCombination = await Student.findById(student._id)
      .populate({
        path: 'subjectCombination',
        populate: {
          path: 'subjects compulsorySubjects',
          model: 'Subject'
        }
      })
      .populate('class');

    // Find the exam
    const exam = await Exam.findById(examId).populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      logToFile(`Class not found for student ${student._id}`);
      return res.status(404).json({ message: 'Class not found for student' });
    }

    // Get character assessment if available
    const characterAssessment = await CharacterAssessment.findOne({
      student: student._id,
      exam: examId
    });

    // Find all results for this student and exam
    const results = await ALevelResult.find({
      studentId: student._id,
      examId: examId
    }).populate('subjectId');

    // If no results found, return empty template
    if (!results || results.length === 0) {
      logToFile(`No results found for student ${student._id} and exam ${examId}`);

      // Return empty template
      const emptyReport = {
        reportTitle: `${exam.name} Result Report`,
        schoolName: 'St. John Vianney School Management System',
        academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
        examName: exam.name,
        examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
        studentDetails: {
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
          gender: student.gender,
          form: student.form || (classObj.name.includes('5') ? 'Form 5' : 'Form 6'),
          subjectCombination: studentWithCombination.subjectCombination
            ? studentWithCombination.subjectCombination.name
            : 'No combination assigned'
        },
        principalSubjects: [],
        subsidiarySubjects: [],
        allSubjects: [],
        summary: {
          totalMarks: 0,
          averageMarks: 0,
          totalPoints: 0,
          bestThreePoints: 0,
          division: 'N/A',
          rank: 'N/A',
          totalStudents: 0,
          gradeDistribution: {
            A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0
          }
        },
        characterAssessment: characterAssessment ? {
          discipline: characterAssessment.discipline || 'Good',
          attendance: characterAssessment.attendance || 'Regular',
          attitude: characterAssessment.attitude || 'Positive',
          comments: characterAssessment.comments || 'No comments provided.'
        } : {
          discipline: 'Not assessed',
          attendance: 'Not assessed',
          attitude: 'Not assessed',
          comments: 'No assessment provided.'
        },
        educationLevel: 'A_LEVEL',
        formLevel: student.form || (classObj.name.includes('5') ? 5 : 6)
      };

      return res.json(emptyReport);
    }

    // Process results
    const subjectResults = [];
    let totalMarks = 0;
    let totalPoints = 0;

    // Get subject combination if available
    const subjectCombination = studentWithCombination.subjectCombination;

    // Determine principal and subsidiary subjects
    const principalSubjectIds = subjectCombination ?
      subjectCombination.subjects.map(s => s._id.toString()) : [];

    const subsidiarySubjectIds = subjectCombination ?
      subjectCombination.compulsorySubjects.map(s => s._id.toString()) : [];

    // Process each result
    for (const result of results) {
      const subject = result.subjectId;

      if (!subject) continue;

      // Determine if this is a principal or subsidiary subject
      const isPrincipal = principalSubjectIds.includes(subject._id.toString());
      const isSubsidiary = subsidiarySubjectIds.includes(subject._id.toString());

      // Calculate grade and points
      const grade = result.grade || calculateGrade(result.marks);
      const points = result.points || calculatePoints(grade);

      // Add to totals
      totalMarks += result.marks;
      totalPoints += points;

      // Add to subject results with explicit marks field
      subjectResults.push({
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        marks: result.marksObtained || result.marks || 0,
        marksObtained: result.marksObtained || result.marks || 0,
        grade,
        points,
        isPrincipal: isPrincipal || (!isSubsidiary && !isPrincipal),
        isSubsidiary: isSubsidiary,
        code: subject.code,
        name: subject.name,
        subject: subject.name
      });
    }

    // Calculate average marks
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Get principal subjects for best three calculation
    const principalSubjectsWithMarks = subjectResults.filter(result => result.isPrincipal);

    // Sort by points (ascending, since lower is better in A-Level)
    principalSubjectsWithMarks.sort((a, b) => a.points - b.points);

    // Get best three (or fewer if not enough results)
    const bestThreePrincipal = principalSubjectsWithMarks.slice(0, 3);
    const bestThreePoints = bestThreePrincipal.reduce((sum, result) => sum + result.points, 0);

    // Calculate division only if we have at least one principal subject result
    const division = principalSubjectsWithMarks.length > 0
      ? calculateDivision(bestThreePoints)
      : 'N/A';

    // Calculate grade distribution
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0
    };

    for (const result of subjectResults) {
      if (gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    }

    // Calculate student rank (position in class)
    let studentRank = 'N/A';
    let totalStudents = 0;

    try {
      // Get all students in the same class
      const classStudents = await Student.find({ class: student.class });
      totalStudents = classStudents.length;

      // Get results for all students in the class
      const allStudentResults = await Promise.all(
        classStudents.map(async (student) => {
          const results = await ALevelResult.find({
            studentId: student._id,
            examId: examId
          }).populate('subjectId');

          // Calculate average marks
          let totalMarks = 0;
          let count = 0;

          for (const result of results) {
            totalMarks += result.marks;
            count++;
          }

          const avgMarks = count > 0 ? totalMarks / count : 0;

          return {
            studentId: student._id,
            averageMarks: avgMarks
          };
        })
      );

      // Sort by average marks (descending)
      allStudentResults.sort((a, b) => b.averageMarks - a.averageMarks);

      // Find the student's position
      const studentPosition = allStudentResults.findIndex(
        result => result.studentId.toString() === student._id.toString()
      );

      if (studentPosition !== -1) {
        studentRank = (studentPosition + 1).toString();
      }
    } catch (error) {
      logToFile(`Error calculating student rank: ${error.message}`);
      console.error('Error calculating student rank:', error);
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        gender: student.gender,
        form: student.form || (classObj.name.includes('5') ? 'Form 5' : 'Form 6'),
        subjectCombination: studentWithCombination.subjectCombination
          ? studentWithCombination.subjectCombination.name
          : 'No combination assigned'
      },
      principalSubjects: subjectResults.filter(result => result.isPrincipal),
      subsidiarySubjects: subjectResults.filter(result => !result.isPrincipal),
      allSubjects: subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestThreePoints,
        division,
        rank: studentRank,
        totalStudents,
        gradeDistribution
      },
      characterAssessment: characterAssessment ? {
        discipline: characterAssessment.discipline || 'Good',
        attendance: characterAssessment.attendance || 'Regular',
        attitude: characterAssessment.attitude || 'Positive',
        comments: characterAssessment.comments || 'No comments provided.'
      } : {
        discipline: 'Not assessed',
        attendance: 'Not assessed',
        attitude: 'Not assessed',
        comments: 'No assessment provided.'
      },
      educationLevel: 'A_LEVEL',
      formLevel: student.form || (classObj.name.includes('5') ? 5 : 6)
    };

    // Return JSON data for API requests
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      logToFile('Returning JSON data for API request');
      return res.json(report);
    }

    // Generate PDF for browser requests
    generateALevelComprehensiveReportPDF(report, res);
  } catch (error) {
    logToFile(`Error generating A-Level report: ${error.message}`);
    console.error('Error generating A-Level report:', error);
    res.status(500).json({
      message: `Error generating A-Level report: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Generate O-Level comprehensive report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} student - Student document
 * @param {String} examId - Exam ID
 * @param {String} academicYear - Academic year ID or "current"
 * @param {String} term - Term name or "current"
 */
async function generateOLevelReport(req, res, student, examId, academicYear, term) {
  try {
    logToFile(`Generating O-Level report for student ${student._id} and exam ${examId}`);

    // Find the exam
    const exam = await Exam.findById(examId).populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      logToFile(`Class not found for student ${student._id}`);
      return res.status(404).json({ message: 'Class not found for student' });
    }

    // Get character assessment if available
    const characterAssessment = await CharacterAssessment.findOne({
      student: student._id,
      exam: examId
    });

    // Find all results for this student and exam
    const results = await OLevelResult.find({
      studentId: student._id,
      examId: examId
    }).populate('subjectId');

    // If no results found, return empty template
    if (!results || results.length === 0) {
      logToFile(`No results found for student ${student._id} and exam ${examId}`);

      // Return empty template
      const emptyReport = {
        reportTitle: `${exam.name} Result Report`,
        schoolName: 'St. John Vianney School Management System',
        academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
        examName: exam.name,
        examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
        studentDetails: {
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
          gender: student.gender,
          form: student.form || classObj.name.replace(/[^0-9]/g, '')
        },
        subjects: [],
        summary: {
          totalMarks: 0,
          averageMarks: 0,
          totalPoints: 0,
          division: 'N/A',
          rank: 'N/A',
          totalStudents: 0,
          gradeDistribution: {
            A: 0, B: 0, C: 0, D: 0, F: 0
          }
        },
        characterAssessment: characterAssessment ? {
          discipline: characterAssessment.discipline || 'Good',
          attendance: characterAssessment.attendance || 'Regular',
          attitude: characterAssessment.attitude || 'Positive',
          comments: characterAssessment.comments || 'No comments provided.'
        } : {
          discipline: 'Not assessed',
          attendance: 'Not assessed',
          attitude: 'Not assessed',
          comments: 'No assessment provided.'
        },
        educationLevel: 'O_LEVEL',
        formLevel: student.form || parseInt(classObj.name.replace(/[^0-9]/g, '')) || 0
      };

      return res.json(emptyReport);
    }

    // Process results
    const subjectResults = [];
    let totalMarks = 0;
    let totalPoints = 0;

    // Process each result
    for (const result of results) {
      const subject = result.subjectId;

      if (!subject) continue;

      // Add to totals
      totalMarks += result.marksObtained || 0;
      totalPoints += result.points || 0;

      // Add to subject results with explicit marks field
      subjectResults.push({
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        marks: result.marksObtained || 0,
        marksObtained: result.marksObtained || 0,
        grade: result.grade || '',
        points: result.points || 0,
        comments: result.comment || '',
        code: subject.code,
        name: subject.name,
        subject: subject.name
      });
    }

    // Calculate average marks
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Calculate division
    const division = calculateOLevelDivision(totalPoints, results.length);

    // Calculate grade distribution
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };

    for (const result of subjectResults) {
      if (gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    }

    // Calculate student rank (position in class)
    let studentRank = 'N/A';
    let totalStudents = 0;

    try {
      // Get all students in the same class
      const classStudents = await Student.find({ class: student.class });
      totalStudents = classStudents.length;

      // Get results for all students in the class
      const allStudentResults = await Promise.all(
        classStudents.map(async (student) => {
          const results = await OLevelResult.find({
            studentId: student._id,
            examId: examId
          });

          // Calculate total points
          let totalPoints = 0;

          for (const result of results) {
            totalPoints += result.points || 0;
          }

          return {
            studentId: student._id,
            totalPoints: totalPoints
          };
        })
      );

      // Sort by total points (ascending for O-Level)
      allStudentResults.sort((a, b) => a.totalPoints - b.totalPoints);

      // Find the student's position
      const studentPosition = allStudentResults.findIndex(
        result => result.studentId.toString() === student._id.toString()
      );

      if (studentPosition !== -1) {
        studentRank = (studentPosition + 1).toString();
      }
    } catch (error) {
      logToFile(`Error calculating student rank: ${error.message}`);
      console.error('Error calculating student rank:', error);
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        gender: student.gender,
        form: student.form || classObj.name.replace(/[^0-9]/g, '')
      },
      subjects: subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        division,
        rank: studentRank,
        totalStudents,
        gradeDistribution
      },
      characterAssessment: characterAssessment ? {
        discipline: characterAssessment.discipline || 'Good',
        attendance: characterAssessment.attendance || 'Regular',
        attitude: characterAssessment.attitude || 'Positive',
        comments: characterAssessment.comments || 'No comments provided.'
      } : {
        discipline: 'Not assessed',
        attendance: 'Not assessed',
        attitude: 'Not assessed',
        comments: 'No assessment provided.'
      },
      educationLevel: 'O_LEVEL',
      formLevel: student.form || parseInt(classObj.name.replace(/[^0-9]/g, '')) || 0
    };

    // Return JSON data
    return res.json(report);
  } catch (error) {
    logToFile(`Error generating O-Level report: ${error.message}`);
    console.error('Error generating O-Level report:', error);
    res.status(500).json({
      message: `Error generating O-Level report: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function to calculate grade for A-Level
function calculateGrade(marks) {
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  if (marks >= 40) return 'E';
  if (marks >= 30) return 'S';
  return 'F';
}

// Helper function to calculate points for A-Level
function calculatePoints(grade) {
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
}

// Helper function to calculate division for A-Level
function calculateDivision(points) {
  if (points <= 9) return 'I';
  if (points <= 12) return 'II';
  if (points <= 17) return 'III';
  if (points <= 19) return 'IV';
  return 'F';
}

// Helper function to calculate division for O-Level
function calculateOLevelDivision(totalPoints, subjectCount) {
  if (subjectCount === 0) return 'N/A';

  const averagePoints = totalPoints / subjectCount;

  if (averagePoints <= 2) return 'I';
  if (averagePoints <= 4) return 'II';
  if (averagePoints <= 6) return 'III';
  if (averagePoints <= 7) return 'IV';
  return 'F';
}

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
  console.log('Comprehensive report test endpoint accessed');
  res.json({ message: 'Comprehensive report routes are working' });
});

module.exports = router;
