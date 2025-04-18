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
// Import necessary functions from the calculator utility
const { getRemarks, calculateDivision, calculateBestThreeAndDivision } = require('../utils/aLevelGradeCalculator');
const fs = require('node:fs'); // Use node: protocol
const path = require('node:path'); // Use node: protocol

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

// Removed local helper functions (calculateGrade, calculatePoints, calculateDivision, getRemarks)
// These are now imported or handled by the model/utility


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
      if (student.subjectCombination.subjects?.length > 0) { // Use optional chaining for length check
        // Ensure subjects are populated objects (using optional chaining)
        const populatedPrincipalSubjects = student.subjectCombination.subjects?.filter(s => s && s._id) || []; // Re-add ?.filter and fallback
        allSubjects = [...allSubjects, ...populatedPrincipalSubjects.map(s => ({
          subject: s,
          isPrincipal: true
        }))];
      }
      // Subsidiary subjects
      if (student.subjectCombination.compulsorySubjects?.length > 0) { // Use optional chaining for length check
        // Ensure subjects are populated objects (using optional chaining)
        const populatedSubsidiarySubjects = student.subjectCombination.compulsorySubjects?.filter(s => s && s._id) || []; // Re-add ?.filter and fallback
        allSubjects = [...allSubjects, ...populatedSubsidiarySubjects.map(s => ({
          subject: s,
          isPrincipal: false
        }))];
      }
    } else {
      logToFile(`Warning: Student ${studentId} is A-Level but has no subjectCombination assigned.`);
      // Decide how to handle this - perhaps return an error or an empty report?
      // For now, we'll continue, but the report might be incomplete.
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
          // Determine if principal based on subject type - add logging if type is missing
          if (!subject.type) {
            logToFile(`Warning: Subject ${subject._id} (${subject.name}) is missing 'type' field. Defaulting isPrincipal to false.`);
          }
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
      // Ensure subjectId is populated
      if (!result.subjectId || !result.subjectId._id) {
          logToFile(`Warning: Result ${result._id} for student ${studentId} is missing populated subjectId. Skipping.`);
          continue; // Skip this result if subject data is missing
      }
      const subject = result.subjectId;

      // Determine if this is a principal subject from the gathered list
      const subjectInfo = allSubjects.find(s => 
        s.subject._id.toString() === subject._id.toString()
      );
      
      // Use the isPrincipal flag determined when building allSubjects list
      const isPrincipal = subjectInfo ? subjectInfo.isPrincipal : (subject.type === 'PRINCIPAL');

      // Use pre-calculated grade and points from the result object
      subjectResults.push({
        subjectId: subject._id, // Store subjectId for accurate placeholder matching
        subject: subject.name,
        code: subject.code,
        marksObtained: result.marksObtained, // Use consistent field name
        grade: result.grade,         // Use existing grade
        points: result.points,       // Use existing points
        isPrincipal,
        remarks: getRemarks(result.grade) // Use imported utility with existing grade
      });
    }
    
    // Then, add empty templates for subjects without results
    for (const subjectInfo of allSubjects) {
      // Ensure subject object exists
      if (!subjectInfo || !subjectInfo.subject || !subjectInfo.subject._id) {
        logToFile('Warning: Invalid subjectInfo found in allSubjects loop. Skipping placeholder check.'); // Removed unnecessary template literal
        continue;
      }
      const subject = subjectInfo.subject;

      // Check if this subject already has a result using subjectId
      const existingResult = subjectResults.find(r =>
        r.subjectId && r.subjectId.toString() === subject._id.toString()
      );

      if (!existingResult) {
        // Add empty template
        subjectResults.push({
          subjectId: subject._id, // Include subjectId in placeholder
          subject: subject.name,
          code: subject.code,
          marksObtained: null, // Marks are null for placeholders
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
      // Use marksObtained for calculations
      if (result.marksObtained !== null && result.marksObtained !== undefined) { // Check marksObtained field from subjectResults
        totalMarks += result.marksObtained; // Use the consistent field name
        totalSubjectsWithMarks++;
      }
    }
    
    const averageMarks = totalSubjectsWithMarks > 0 ? totalMarks / totalSubjectsWithMarks : 0;
    
    // Calculate total points (only for subjects with results)
    const totalPoints = subjectResults
      .filter(result => result.points !== null)
      .reduce((sum, result) => sum + result.points, 0);
    
    // Calculate best three principal subjects and division using the imported utility
    // Pass only the results that have actual marks/points
    const resultsWithPoints = subjectResults.filter(r => r.points !== null);
    const principalSubjectIdsForCalc = allSubjects
        .filter(s => s.isPrincipal && s.subject && s.subject._id)
        .map(s => s.subject._id);

    const { bestThreePoints, division } = calculateBestThreeAndDivision(resultsWithPoints, principalSubjectIdsForCalc);
    
    // Calculate grade distribution
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0
    };
    
    for (const result of subjectResults) {
      if (result.grade && result.grade !== 'N/A' && gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    }
    
    // --- Optimized Rank Calculation ---
    let studentRank = 'N/A';
    let totalStudents = 0;
    try {
      // 1. Fetch all results for the class and exam ONCE
      const allClassResults = await ALevelResult.find({
        classId: student.class, // Use classId from the student object
        examId: examId
      });
      logToFile(`Fetched ${allClassResults.length} results for class ${student.class} and exam ${examId} for rank calculation.`);

      // 2. Group results by studentId and calculate average marksObtained
      const studentAverages = {};
      for (const result of allClassResults) {
        const sId = result.studentId.toString();
        if (!studentAverages[sId]) {
          studentAverages[sId] = { totalMarks: 0, count: 0, studentId: result.studentId };
        }
        // Ensure marksObtained is a number before adding
        const marks = Number(result.marksObtained);
        if (!Number.isNaN(marks)) { // Use Number.isNaN for type safety
            studentAverages[sId].totalMarks += marks;
            studentAverages[sId].count++;
        }
      }

      // 3. Calculate average for each student
      const studentAverageList = Object.values(studentAverages).map(data => ({
        studentId: data.studentId,
        averageMarks: data.count > 0 ? data.totalMarks / data.count : 0
      }));
      totalStudents = studentAverageList.length; // Update total students based on those with results

      // 4. Sort students by average marks (descending)
      studentAverageList.sort((a, b) => b.averageMarks - a.averageMarks);

      // 5. Assign ranks (handling ties)
      let currentRank = 0;
      let previousAvg = -1; // Use a value that marks cannot be
      let studentsAtRank = 0;
      const rankedStudents = studentAverageList.map((avgData, index) => {
          if (avgData.averageMarks !== previousAvg) {
              currentRank += (studentsAtRank); // Add the number of tied students from previous rank
              studentsAtRank = 1; // Reset count for current rank
              currentRank++; // Increment rank for the new score
              previousAvg = avgData.averageMarks;
          } else {
              studentsAtRank++; // Increment tied students count
          }
          return { ...avgData, rank: currentRank };
      });


      // 6. Find the target student's rank
      const targetStudentRankData = rankedStudents.find(s => s.studentId.toString() === studentId);
      if (targetStudentRankData) {
        studentRank = targetStudentRankData.rank;
      } else {
        logToFile(`Warning: Student ${studentId} not found in ranked list for class ${student.class}. Rank set to N/A.`);
        // This might happen if the student had no results for this exam
        studentRank = 'N/A';
        // Ensure totalStudents reflects the count from Student.find if needed elsewhere,
        // but for ranking, totalStudents should reflect those ranked.
        const classStudentCount = await Student.countDocuments({ class: student.class });
        totalStudents = classStudentCount; // Use actual class count for display if different
      }

    } catch (error) {
      logToFile(`Error calculating student rank: ${error.message} ${error.stack}`);
      studentRank = 'Error'; // Indicate error in rank calculation
    }
    // --- End Optimized Rank Calculation ---
    
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
    
    // Return JSON data for API requests (using optional chaining)
    if (req.headers.accept?.includes('application/json')) {
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
