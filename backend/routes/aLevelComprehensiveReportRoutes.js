const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const ALevelResult = require('../models/ALevelResult');
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

const logFile = path.join(logDir, `a_level_reports_${new Date().toISOString().split('T')[0]}.log`);
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

// Helper function to calculate grade
function calculateGrade(marks) {
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  if (marks >= 40) return 'E';
  if (marks >= 30) return 'S';
  return 'F';
}

// Helper function to calculate points
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

// Helper function to calculate division
function calculateDivision(points) {
  if (points >= 3 && points <= 9) return 'I';
  if (points >= 10 && points <= 12) return 'II';
  if (points >= 13 && points <= 17) return 'III';
  if (points >= 18 && points <= 19) return 'IV';
  if (points >= 20 && points <= 21) return 'V';
  return '0';
}

// Helper function to get remarks
function getRemarks(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'E': return 'Pass';
    case 'S': return 'Subsidiary Pass';
    case 'F': return 'Fail';
    default: return 'N/A';
  }
}

/**
 * Get comprehensive A-Level student report
 * This endpoint provides a detailed report for Form 5 and Form 6 students
 * showing both Principal and Subsidiary subjects with all performance metrics
 */
router.get('/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    logToFile(`GET /api/a-level-comprehensive/student/${studentId}/${examId} - Generating comprehensive A-Level report`);
    
    // Find the student with subject combination
    const student = await Student.findById(studentId)
      .populate({
        path: 'subjectCombination',
        populate: {
          path: 'subjects compulsorySubjects',
          model: 'Subject'
        }
      })
      .populate('class');
    
    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify this is an A-Level student (Form 5 or Form 6)
    if (student.educationLevel !== 'A_LEVEL') {
      logToFile(`Student ${studentId} is not an A-Level student`);
      return res.status(400).json({ message: 'This report is only for A-Level students' });
    }
    
    // Find the exam
    const exam = await Exam.findById(examId).populate('academicYear');
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
    
    // Get character assessment if available
    const characterAssessment = await CharacterAssessment.findOne({
      student: studentId,
      exam: examId
    });
    
    // Find all results for this student and exam
    const results = await ALevelResult.find({
      studentId: studentId,
      examId: examId
    }).populate('subjectId');
    
    // Get all subjects the student should be taking
    let allSubjects = [];
    
    // Add subjects from subject combination if available
    if (student.subjectCombination) {
      // Principal subjects
      if (student.subjectCombination.subjects && student.subjectCombination.subjects.length > 0) {
        allSubjects = [...allSubjects, ...student.subjectCombination.subjects.map(s => ({
          subject: s,
          isPrincipal: true
        }))];
      }
      
      // Subsidiary subjects
      if (student.subjectCombination.compulsorySubjects && student.subjectCombination.compulsorySubjects.length > 0) {
        allSubjects = [...allSubjects, ...student.subjectCombination.compulsorySubjects.map(s => ({
          subject: s,
          isPrincipal: false
        }))];
      }
    }
    
    // Add subjects from student's selectedSubjects if available
    if (student.selectedSubjects && student.selectedSubjects.length > 0) {
      // Fetch the subjects
      const selectedSubjects = await Subject.find({
        _id: { $in: student.selectedSubjects }
      });
      
      // Add to allSubjects if not already included
      for (const subject of selectedSubjects) {
        const existingIndex = allSubjects.findIndex(s => 
          s.subject._id.toString() === subject._id.toString()
        );
        
        if (existingIndex === -1) {
          // Determine if principal based on subject type
          const isPrincipal = subject.type === 'PRINCIPAL';
          allSubjects.push({
            subject,
            isPrincipal
          });
        }
      }
    }
    
    // Process subject results
    const subjectResults = [];
    
    // First, add results for subjects that have marks
    for (const result of results) {
      const subject = result.subjectId;
      
      // Determine if this is a principal subject
      const subjectInfo = allSubjects.find(s => 
        s.subject._id.toString() === subject._id.toString()
      );
      
      const isPrincipal = subjectInfo ? subjectInfo.isPrincipal : subject.type === 'PRINCIPAL';
      
      subjectResults.push({
        subject: subject.name,
        code: subject.code,
        marks: result.marks,
        grade: calculateGrade(result.marks),
        points: calculatePoints(calculateGrade(result.marks)),
        isPrincipal,
        remarks: getRemarks(calculateGrade(result.marks))
      });
    }
    
    // Then, add empty templates for subjects without results
    for (const subjectInfo of allSubjects) {
      const subject = subjectInfo.subject;
      
      // Check if this subject already has a result
      const existingResult = subjectResults.find(r => 
        r.subject === subject.name || r.code === subject.code
      );
      
      if (!existingResult) {
        // Add empty template
        subjectResults.push({
          subject: subject.name,
          code: subject.code,
          marks: null,
          grade: 'N/A',
          points: null,
          isPrincipal: subjectInfo.isPrincipal,
          remarks: 'No result available'
        });
      }
    }
    
    // Calculate performance metrics
    let totalMarks = 0;
    let totalSubjectsWithMarks = 0;
    
    for (const result of subjectResults) {
      if (result.marks !== null) {
        totalMarks += result.marks;
        totalSubjectsWithMarks++;
      }
    }
    
    const averageMarks = totalSubjectsWithMarks > 0 ? totalMarks / totalSubjectsWithMarks : 0;
    
    // Calculate total points (only for subjects with results)
    const totalPoints = subjectResults
      .filter(result => result.points !== null)
      .reduce((sum, result) => sum + result.points, 0);
    
    // Calculate best three principal subjects and division
    const principalSubjectsWithMarks = subjectResults
      .filter(result => result.isPrincipal && result.points !== null);
    
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
      if (result.grade && result.grade !== 'N/A' && gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    }
    
    // Get student rank if possible
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
      
      // Find this student's rank
      const studentIndex = allStudentResults.findIndex(s => 
        s.studentId.toString() === studentId
      );
      
      if (studentIndex !== -1) {
        studentRank = studentIndex + 1;
      }
    } catch (error) {
      logToFile(`Error calculating student rank: ${error.message}`);
      // Continue without rank if there's an error
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
        gender: student.gender,
        form: student.form || (classObj.name.includes('5') ? 'Form 5' : 'Form 6'),
        subjectCombination: student.subjectCombination 
          ? student.subjectCombination.name 
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
    logToFile(`Error generating comprehensive A-Level report: ${error.message}`);
    console.error('Error generating comprehensive A-Level report:', error);
    res.status(500).json({ 
      message: `Error generating comprehensive A-Level report: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
  console.log('A-Level comprehensive report test endpoint accessed');
  res.json({ message: 'A-Level comprehensive report routes are working' });
});

module.exports = router;
