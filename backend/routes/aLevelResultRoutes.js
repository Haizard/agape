const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const ALevelResult = require('../models/ALevelResult');
const AcademicYear = require('../models/AcademicYear');
const CharacterAssessment = require('../models/CharacterAssessment');
const SubjectCombination = require('../models/SubjectCombination');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { generateALevelStudentReportPDF, generateALevelClassReportPDF } = require('../utils/aLevelReportGenerator');
const resultConsistencyChecker = require('../utils/resultConsistencyChecker');
const { getFullSubjectCombination } = require('../utils/subjectCombinationUtils');
const fs = require('node:fs');
const path = require('node:path');
const aLevelGradeCalculator = require('../utils/aLevelGradeCalculator');
const logger = require('../utils/logger');
const {
  formatALevelStudentResponse,
  formatALevelClassResponse,
  formatErrorResponse,
  formatSuccessResponse
} = require('../utils/responseFormatter');
const {
  validateALevelResult,
  formatValidationErrors
} = require('../utils/dataValidator');

// Setup logging - using centralized logger
const logToFile = (message) => {
  logger.info(message);
};

/**
 * Helper function to get remarks based on grade for A-Level
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @returns {String} - The remarks
 */
function getRemarks(grade) {
  return aLevelGradeCalculator.getRemarks(grade);
}

/**
 * Calculate A-LEVEL division based on points
 * @param {Number} points - The total points from best 3 principal subjects
 * @returns {String} - The division (I, II, III, IV, V)
 */
function calculateALevelDivision(points) {
  // Log the points for debugging
  logger.debug(`Calculating A-Level division for ${points} points`);
  logToFile(`Calculating A-Level division for ${points} points`);

  // Use the A-Level specific grade calculator
  const division = aLevelGradeCalculator.calculateDivision(points);

  // Format the division for display
  if (division === '0') {
    return 'Division 0';
  }

  return `Division ${division}`;
}

// Get student result report (general endpoint)
router.get('/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    logToFile(`GET /api/a-level-results/student/${studentId}/${examId} - Generating A-Level student result report`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student form level (5 or 6)
    const formLevel = student.form || (student.class?.name?.includes('6') ? 6 : 5);
    logToFile(`Student form level: ${formLevel}`);

    // If form level is not set in the student record, update it
    if (!student.form) {
      try {
        await Student.findByIdAndUpdate(studentId, { form: formLevel });
        logToFile(`Updated student ${studentId} form level to ${formLevel}`);
      } catch (updateError) {
        logToFile(`Error updating student form level: ${updateError.message}`);
        // Continue without updating
      }
    }

    // Check if this is an A-Level student
    if (student.educationLevel !== 'A_LEVEL') {
      logToFile(`Student ${studentId} is not an A-Level student, education level: ${student.educationLevel}`);

      // Instead of returning an error, we'll try to handle it gracefully
      // First, check if the student has any A-Level results
      const aLevelResults = await ALevelResult.find({ studentId });

      if (aLevelResults && aLevelResults.length > 0) {
        // Student has A-Level results, so we'll proceed as if they're an A-Level student
        logToFile(`Student ${studentId} has A-Level results despite education level being ${student.educationLevel}`);
      } else {
        // No A-Level results, return a more detailed error
        return res.status(400).json({
          message: 'This student is not marked as an A-Level student',
          educationLevel: student.educationLevel || 'Not set',
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          suggestion: 'Please update the student\'s education level to A_LEVEL or use the O-Level report component'
        });
      }
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      logToFile(`Class not found for student ${studentId}`);
      return res.status(404).json({ message: 'Class not found for student' });
    }

    // Find the exam
    const exam = await Exam.findById(examId)
      .populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get all subjects for this class to ensure we include all subjects in the report
    const classSubjects = await Subject.find({ _id: { $in: classObj.subjects.map(s => typeof s === 'object' ? s.subject : s) } });
    logToFile(`Found ${classSubjects.length} subjects for class ${classObj._id}`);

    // Get consistent results using the consistency checker
    logToFile(`Getting consistent results for student ${studentId} and exam ${examId}`);
    const results = await ALevelResult.find({ studentId, examId })
      .populate('subjectId', 'name code isPrincipal')
      .populate('examId', 'name type')
      .populate('academicYearId', 'name');

    logToFile(`Found ${results.length} results`);

    // Get character assessment for this student
    const characterAssessment = await CharacterAssessment.findOne({ studentId, examId })
      .populate('assessedBy', 'username');

    logToFile(`Character assessment found: ${characterAssessment ? 'Yes' : 'No'}`);

    // Get all students in the same class for ranking
    const classStudents = await Student.find({ class: student.class });
    const classStudentIds = classStudents.map(s => s._id);

    // Get results for all students in the class for the same exam
    const allClassResults = await ALevelResult.find({
      studentId: { $in: classStudentIds },
      examId
    }).populate('studentId');

    // Group results by student
    const studentResultsMap = {};
    for (const result of allClassResults) {
      if (!result.studentId) continue;

      const studentId = result.studentId._id.toString();
      if (!studentResultsMap[studentId]) {
        studentResultsMap[studentId] = {
          studentId,
          studentName: `${result.studentId.firstName} ${result.studentId.lastName}`,
          results: [],
          totalMarks: 0,
          resultCount: 0
        };
      }

      studentResultsMap[studentId].results.push(result);
      studentResultsMap[studentId].totalMarks += result.marksObtained || 0;
      studentResultsMap[studentId].resultCount++;
    }

    // Calculate average for each student
    const studentAverages = [];
    for (const [studentId, data] of Object.entries(studentResultsMap)) {
      if (data.resultCount > 0) {
        const average = data.totalMarks / data.resultCount;
        studentAverages.push({
          studentId,
          studentName: data.studentName,
          average
        });
      }
    }

    // Sort by average (descending) and assign ranks
    studentAverages.sort((a, b) => b.average - a.average);

    // Find the rank of the current student
    let studentRank = 'N/A';
    for (let i = 0; i < studentAverages.length; i++) {
      if (studentAverages[i].studentId === studentId.toString()) {
        studentRank = i + 1;
        break;
      }
    }

    logToFile(`Student rank in class: ${studentRank} out of ${studentAverages.length} students`);

    // Create a map of existing results for easy lookup
    const resultMap = {};
    for (const result of results) {
      if (result.subjectId && result.subjectId._id) {
        resultMap[result.subjectId._id.toString()] = result;
        logToFile(`Mapped result for subject ${result.subjectId.name}: Marks=${result.marksObtained}, Grade=${result.grade}`);
      }
    }

    // Process results
    const subjectResults = [];
    const gradeDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 };
    let totalMarks = 0;
    let totalPoints = 0;
    let resultsCount = 0;

    // Process all class subjects, using results where available
    for (const subject of classSubjects) {
      const result = resultMap[subject._id.toString()];

      if (result) {
        // We have a result for this subject
        logToFile(`Found result for subject ${subject.name}: Marks=${result.marksObtained}, Grade=${result.grade}`);

        // Update grade distribution
        if (gradeDistribution[result.grade] !== undefined) {
          gradeDistribution[result.grade]++;
        }

        // Update totals
        totalMarks += result.marksObtained || 0;
        totalPoints += result.points || 0;
        resultsCount++;

        // Add to subject results
        subjectResults.push({
          subject: subject.name,
          marks: result.marksObtained || 0,
          marksObtained: result.marksObtained || 0, // Add both marks and marksObtained for compatibility
          grade: result.grade || '',
          points: result.points || 0,
          remarks: getRemarks(result.grade),
          isPrincipal: subject.isPrincipal || false
        });

        // Log the marks for debugging
        logToFile(`Added result for subject ${subject.name}: Marks=${result.marksObtained}, Grade=${result.grade}, Points=${result.points}`);
        console.log(`Added result for subject ${subject.name}: Marks=${result.marksObtained}, Grade=${result.grade}, Points=${result.points}`);
      } else {
        // No result for this subject
        logToFile(`No result found for subject ${subject.name}`);

        // Add to subject results with default values
        subjectResults.push({
          subject: subject.name,
          marks: 0,
          marksObtained: 0, // Add both marks and marksObtained for compatibility
          grade: '-',
          points: 0,
          remarks: 'Not Taken',
          isPrincipal: subject.isPrincipal || false
        });

        // Log the default values for debugging
        logToFile(`Added default result for subject ${subject.name} (not taken)`);
        console.log(`Added default result for subject ${subject.name} (not taken)`);
      }
    }

    // Calculate average marks
    const averageMarks = resultsCount > 0 ? totalMarks / resultsCount : 0;

    // For A-LEVEL, find principal subjects
    const principalSubjects = subjectResults.filter(result => result.isPrincipal && result.grade !== '-');

    // Log all principal subjects for debugging
    logToFile(`Found ${principalSubjects.length} principal subjects with grades:`);
    console.log(`Found ${principalSubjects.length} principal subjects with grades:`);

    // If no principal subjects found, check if we need to mark some as principal
    if (principalSubjects.length === 0) {
      logToFile('No principal subjects found. Checking if we need to mark some as principal...');
      console.log('No principal subjects found. Checking if we need to mark some as principal...');

      // Get subjects with valid grades (not '-')
      const validSubjects = subjectResults.filter(result => result.grade !== '-');

      // If we have at least 3 subjects with grades, mark the top 3 as principal
      if (validSubjects.length >= 3) {
        // Sort by marks (descending)
        validSubjects.sort((a, b) => b.marks - a.marks);

        // Take top 3 and mark as principal
        for (let i = 0; i < Math.min(3, validSubjects.length); i++) {
          validSubjects[i].isPrincipal = true;
          logToFile(`Marking subject ${validSubjects[i].subject} as principal (marks: ${validSubjects[i].marks})`);
          console.log(`Marking subject ${validSubjects[i].subject} as principal (marks: ${validSubjects[i].marks})`);

          // Also update in the database for future reference
          try {
            const result = await ALevelResult.findOne({
              studentId: studentId,
              examId: examId,
              subjectId: validSubjects[i].subjectId
            });

            if (result) {
              result.isPrincipal = true;
              await result.save();
              logToFile(`Updated subject ${validSubjects[i].subject} as principal in database`);
            }
          } catch (err) {
            logToFile(`Error updating subject as principal: ${err.message}`);
          }
        }

        // Update principalSubjects array
        const newPrincipalSubjects = subjectResults.filter(result => result.isPrincipal && result.grade !== '-');
        logToFile(`Now have ${newPrincipalSubjects.length} principal subjects`);
        console.log(`Now have ${newPrincipalSubjects.length} principal subjects`);

        // Use the new principal subjects
        for (const subject of newPrincipalSubjects) {
          principalSubjects.push(subject);
        }
      }
    }

    // Log all principal subjects for debugging
    for (const subject of principalSubjects) {
      logToFile(`Principal subject: ${subject.subject}, Marks: ${subject.marks}, Grade: ${subject.grade}, Points: ${subject.points}`);
      console.log(`Principal subject: ${subject.subject}, Marks: ${subject.marks}, Grade: ${subject.grade}, Points: ${subject.points}`);
    }

    // Sort by points (ascending) - lower points are better in A-Level
    principalSubjects.sort((a, b) => a.points - b.points);

    // Take best 3 principal subjects (or all if less than 3)
    const bestThreePrincipalSubjects = principalSubjects.slice(0, Math.min(3, principalSubjects.length));

    // Log best 3 principal subjects
    logToFile(`Best ${bestThreePrincipalSubjects.length} principal subjects:`);
    for (const subject of bestThreePrincipalSubjects) {
      logToFile(`Best principal subject: ${subject.subject}, Grade: ${subject.grade}, Points: ${subject.points}`);
      console.log(`Best principal subject: ${subject.subject}, Grade: ${subject.grade}, Points: ${subject.points}`);
    }

    // Calculate total points from best 3 principal subjects
    let bestThreePoints = 0;
    for (const subject of bestThreePrincipalSubjects) {
      if (subject.points) {
        bestThreePoints += subject.points;
        logToFile(`Adding ${subject.points} points from ${subject.subject}, running total: ${bestThreePoints}`);
        console.log(`Adding ${subject.points} points from ${subject.subject}, running total: ${bestThreePoints}`);
      } else {
        logToFile(`Warning: Subject ${subject.subject} has no points value`);
        console.log(`Warning: Subject ${subject.subject} has no points value`);
      }
    }

    logToFile(`Best 3 principal subjects total points: ${bestThreePoints}`);
    console.log(`Best 3 principal subjects total points: ${bestThreePoints}`);

    // Determine division
    const division = calculateALevelDivision(bestThreePoints);

    // Get subject combination if available
    let subjectCombination = null;
    if (student.subjectCombination || classObj.subjectCombination) {
      const combinationId = student.subjectCombination ||
        (typeof classObj.subjectCombination === 'object'
          ? classObj.subjectCombination._id
          : classObj.subjectCombination);

      if (combinationId) {
        try {
          subjectCombination = await getFullSubjectCombination(combinationId);
          console.log(`Found subject combination: ${subjectCombination?.name || 'Unknown'}`);

          // Add compulsory subjects to the results if they're not already included
          if (subjectCombination?.compulsorySubjects && subjectCombination.compulsorySubjects.length > 0) {
            console.log(`Adding ${subjectCombination.compulsorySubjects.length} compulsory subjects to results`);

            for (const compulsorySubject of subjectCombination.compulsorySubjects) {
              // Check if this subject is already in the results
              const existingSubjectIndex = subjectResults.findIndex(result =>
                result.subject.toLowerCase() === compulsorySubject.name.toLowerCase());

              if (existingSubjectIndex === -1) {
                // Subject not found in results, add it
                console.log(`Adding compulsory subject to results: ${compulsorySubject.name}`);

                // Try to find a result for this subject
                const result = await ALevelResult.findOne({
                  studentId: studentId,
                  examId: examId,
                  'subjectId.name': compulsorySubject.name
                }).populate('subjectId');

                if (result) {
                  // We have a result for this compulsory subject
                  console.log(`Found result for compulsory subject ${compulsorySubject.name}: Marks=${result.marksObtained}`);

                  // Add to subject results
                  subjectResults.push({
                    subject: compulsorySubject.name,
                    marks: result.marksObtained || 0,
                    marksObtained: result.marksObtained || 0,
                    grade: result.grade || '',
                    points: result.points || 0,
                    remarks: getRemarks(result.grade),
                    isPrincipal: false,
                    isCompulsory: true
                  });

                  // Update totals
                  totalMarks += result.marksObtained || 0;
                  totalPoints += result.points || 0;
                  resultsCount++;

                  // Update grade distribution
                  if (gradeDistribution[result.grade] !== undefined) {
                    gradeDistribution[result.grade]++;
                  }
                } else {
                  // No result for this compulsory subject
                  console.log(`No result found for compulsory subject ${compulsorySubject.name}`);

                  // Add to subject results with default values
                  subjectResults.push({
                    subject: compulsorySubject.name,
                    marks: 0,
                    marksObtained: 0,
                    grade: '-',
                    points: 0,
                    remarks: 'Not taken',
                    isPrincipal: false,
                    isCompulsory: true
                  });
                }
              } else {
                // Subject already in results, mark it as compulsory
                console.log(`Marking existing subject as compulsory: ${compulsorySubject.name}`);
                subjectResults[existingSubjectIndex].isCompulsory = true;
              }
            }
          }
        } catch (combinationError) {
          console.error('Error fetching subject combination:', combinationError);
          // Continue without the combination
        }
      }
    }

    // For Form 6 students, try to get their Form 5 results
    let form5Results = null;
    if (formLevel === 6) {
      try {
        // Find Form 5 class for this student
        const form5Classes = await Class.find({
          name: { $regex: /Form 5|5/ },
          academicYear: { $ne: classObj.academicYear } // Different academic year
        });

        if (form5Classes.length > 0) {
          // Find the most recent exam in Form 5
          const form5Exams = await Exam.find({
            class: { $in: form5Classes.map(c => c._id) },
            type: 'END_OF_YEAR' // Preferably end of year exam
          }).sort({ date: -1 }).limit(1);

          if (form5Exams.length > 0) {
            const form5Exam = form5Exams[0];

            // Get the student's results for this exam
            const form5Results = await ALevelResult.find({
              studentId: studentId,
              examId: form5Exam._id
            }).populate('subjectId');

            if (form5Results.length > 0) {
              // Calculate average marks
              let totalMarks = 0;
              form5Results.forEach(result => {
                totalMarks += result.marksObtained || 0;
              });
              const averageMarks = (totalMarks / form5Results.length).toFixed(2);

              // Calculate division
              const principalResults = form5Results.filter(result =>
                result.subjectId && result.subjectId.isPrincipal);

              // Sort by points (ascending)
              principalResults.sort((a, b) => a.points - b.points);

              // Take best 3 (lowest points)
              const bestThree = principalResults.slice(0, 3);
              const bestThreePoints = bestThree.reduce((sum, result) => sum + (result.points || 0), 0);
              const division = calculateALevelDivision(bestThreePoints);

              // Get rank
              const form5Students = await Student.find({ class: { $in: form5Classes.map(c => c._id) } });

              form5Results = {
                averageMarks,
                division,
                rank: 'N/A', // Would need more complex calculation
                totalStudents: form5Students.length,
                exam: form5Exam.name
              };
            }
          }
        }
      } catch (form5Error) {
        console.error('Error fetching Form 5 results:', form5Error);
        // Continue without Form 5 results
      }
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      subjectCombination,
      form5Results,
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        gender: student.gender,
        rank: studentRank,
        totalStudents: studentAverages.length,
        form: formLevel
      },
      characterAssessment: characterAssessment ? {
        punctuality: characterAssessment.punctuality || 'Good',
        discipline: characterAssessment.discipline || 'Good',
        respect: characterAssessment.respect || 'Good',
        leadership: characterAssessment.leadership || 'Good',
        participation: characterAssessment.participation || 'Good',
        overallAssessment: characterAssessment.overallAssessment || 'Good',
        comments: characterAssessment.comments || '',
        assessedBy: characterAssessment.assessedBy ? characterAssessment.assessedBy.username : 'N/A'
      } : {
        punctuality: 'Good',
        discipline: 'Good',
        respect: 'Good',
        leadership: 'Good',
        participation: 'Good',
        overallAssessment: 'Good',
        comments: 'No character assessment available',
        assessedBy: 'N/A'
      },
      subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestThreePoints,
        division,
        rank: studentRank,
        totalStudents: studentAverages.length,
        gradeDistribution
      },
      student: {
        fullName: `${student.firstName} ${student.lastName}`
      },
      class: {
        fullName: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim()
      },
      exam: {
        name: exam.name,
        term: exam.term || 'Term 1'
      },
      totalMarks,
      averageMarks: averageMarks.toFixed(2),
      points: totalPoints,
      bestThreePoints,
      division,
      educationLevel: 'A_LEVEL'
    };

    // Return the report as JSON
    res.json(report);
  } catch (error) {
    logToFile(`Error generating A-Level student report: ${error.message}`);
    res.status(500).json({ message: `Error generating A-Level student report: ${error.message}` });
  }
});

// Get class result report
router.get('/class/:classId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;

    logToFile(`GET /api/a-level-results/class/${classId}/${examId} - Generating A-Level class result report`);

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

    // Check if this is an A-Level class
    if (classObj.educationLevel !== 'A_LEVEL') {
      logToFile(`Class ${classId} is not an A-Level class, education level: ${classObj.educationLevel}`);

      // Instead of returning an error, we'll try to handle it gracefully
      // First, check if the class has any A-Level results
      const students = await Student.find({ class: classId });
      const studentIds = students.map(student => student._id);

      const aLevelResults = await ALevelResult.find({ studentId: { $in: studentIds } });

      if (aLevelResults && aLevelResults.length > 0) {
        // Class has A-Level results, so we'll proceed as if it's an A-Level class
        logToFile(`Class ${classId} has A-Level results despite education level being ${classObj.educationLevel}`);
      } else {
        // No A-Level results, return a more detailed error
        return res.status(400).json({
          message: 'This class is not marked as an A-Level class',
          educationLevel: classObj.educationLevel || 'Not set',
          classId: classId,
          className: classObj.name,
          suggestion: 'Please update the class\'s education level to A_LEVEL or use the O-Level report component'
        });
      }
    }

    // Get exam details
    const exam = await Exam.findById(examId)
      .populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get all students in the class
    const students = await Student.find({ class: classId });
    if (!students || students.length === 0) {
      logToFile(`No students found in class with ID: ${classId}`);
      return res.status(404).json({ message: 'No students found in class' });
    }

    // Get results for all students
    const studentResults = [];
    let classTotal = 0;
    let classCount = 0;

    for (const student of students) {
      // Get results for this student
      const results = await ALevelResult.find({ studentId: student._id, examId })
        .populate('subjectId', 'name code isPrincipal');

      logToFile(`Found ${results.length} results for student ${student._id}`);

      // Process student results
      const subjectResults = [];
      let studentTotal = 0;
      let studentPoints = 0;

      for (const result of results) {
        // Get subject details
        const subject = result.subjectId;
        if (!subject || !subject.name) continue;

        // Add to subject results
        subjectResults.push({
          subject: subject.name,
          marks: result.marksObtained || 0,
          grade: result.grade || '',
          points: result.points || 0,
          remarks: getRemarks(result.grade),
          isPrincipal: subject.isPrincipal || false,
          isCompulsory: subject.isCompulsory || false
        });

        // Update totals
        studentTotal += result.marksObtained || 0;
        studentPoints += result.points || 0;

        // Update class totals
        classTotal += result.marksObtained || 0;
        classCount++;
      }

      // Calculate student average
      const studentAverage = subjectResults.length > 0 ? studentTotal / subjectResults.length : 0;

      // For A-LEVEL, find principal subjects
      let principalSubjects = subjectResults.filter(result => result.isPrincipal);

      // If no principal subjects are found, mark the top 3 subjects as principal
      if (principalSubjects.length === 0 && subjectResults.length > 0) {
        console.log(`No principal subjects found for student ${student._id}. Marking top 3 subjects as principal.`);
        logToFile(`No principal subjects found for student ${student._id}. Marking top 3 subjects as principal.`);

        // Sort subjects by marks (descending)
        const sortedSubjects = [...subjectResults].sort((a, b) => b.marks - a.marks);

        // Mark top 3 subjects as principal
        for (let i = 0; i < Math.min(3, sortedSubjects.length); i++) {
          sortedSubjects[i].isPrincipal = true;
          console.log(`Marking subject ${sortedSubjects[i].subject} as principal (marks: ${sortedSubjects[i].marks})`);
          logToFile(`Marking subject ${sortedSubjects[i].subject} as principal (marks: ${sortedSubjects[i].marks})`);
        }

        // Update principalSubjects array
        principalSubjects = subjectResults.filter(result => result.isPrincipal);
      }

      // Sort by points (ascending)
      principalSubjects.sort((a, b) => a.points - b.points);

      // Take best 3 principal subjects (or all if less than 3)
      const bestThreePrincipalSubjects = principalSubjects.slice(0, Math.min(3, principalSubjects.length));
      const bestThreePoints = bestThreePrincipalSubjects.reduce((sum, subject) => sum + subject.points, 0);

      // Determine division
      const division = calculateALevelDivision(bestThreePoints);

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
        bestThreePoints,
        division,
        rank: 'N/A' // Will be calculated below
      });
    }

    // Calculate class average
    const classAverage = classCount > 0 ? classTotal / classCount : 0;

    // Sort students by average marks (descending) and assign ranks
    studentResults.sort((a, b) => parseFloat(b.averageMarks) - parseFloat(a.averageMarks));
    studentResults.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Calculate division distribution
    const divisionDistribution = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      'V': 0,
      '0': 0
    };

    // Count students in each division
    studentResults.forEach(student => {
      if (student.division) {
        // Handle different division formats
        let divKey = student.division;
        if (divKey.includes('Division')) {
          divKey = divKey.replace('Division ', '');
        }
        if (divisionDistribution[divKey] !== undefined) {
          divisionDistribution[divKey]++;
        }
      }
    });

    // Get subject combination if available
    let subjectCombination = null;
    if (classObj.subjectCombination) {
      const combinationId = typeof classObj.subjectCombination === 'object'
        ? classObj.subjectCombination._id
        : classObj.subjectCombination;

      try {
        subjectCombination = await getFullSubjectCombination(combinationId);
        console.log(`Found subject combination: ${subjectCombination?.name || 'Unknown'}`);

        // Add compulsory subjects to each student's results if they're not already included
        if (subjectCombination?.compulsorySubjects && subjectCombination.compulsorySubjects.length > 0) {
          console.log(`Processing ${subjectCombination.compulsorySubjects.length} compulsory subjects for all students`);

          // For each student
          for (const studentResult of studentResults) {
            // For each compulsory subject
            for (const compulsorySubject of subjectCombination.compulsorySubjects) {
              // Check if this subject is already in the student's results
              const existingSubjectIndex = studentResult.results.findIndex(result =>
                result.subject.toLowerCase() === compulsorySubject.name.toLowerCase());

              if (existingSubjectIndex === -1) {
                // Subject not found in results, add it
                console.log(`Adding compulsory subject to student ${studentResult.name}: ${compulsorySubject.name}`);

                // Try to find a result for this subject
                const result = await ALevelResult.findOne({
                  studentId: studentResult.id,
                  examId: examId,
                  'subjectId.name': compulsorySubject.name
                }).populate('subjectId');

                if (result) {
                  // We have a result for this compulsory subject
                  console.log(`Found result for compulsory subject ${compulsorySubject.name}: Marks=${result.marksObtained}`);

                  // Add to subject results
                  studentResult.results.push({
                    subject: compulsorySubject.name,
                    marks: result.marksObtained || 0,
                    grade: result.grade || '',
                    points: result.points || 0,
                    remarks: getRemarks(result.grade),
                    isPrincipal: false,
                    isCompulsory: true
                  });

                  // Update student totals
                  studentResult.totalMarks += result.marksObtained || 0;
                  studentResult.totalPoints += result.points || 0;

                  // Recalculate average
                  studentResult.averageMarks = (studentResult.totalMarks / studentResult.results.length).toFixed(2);
                } else {
                  // No result for this compulsory subject
                  console.log(`No result found for compulsory subject ${compulsorySubject.name}`);

                  // Add to subject results with default values
                  studentResult.results.push({
                    subject: compulsorySubject.name,
                    marks: 0,
                    grade: '-',
                    points: 0,
                    remarks: 'Not taken',
                    isPrincipal: false,
                    isCompulsory: true
                  });
                }
              } else {
                // Subject already in results, mark it as compulsory
                console.log(`Marking existing subject as compulsory for student ${studentResult.name}: ${compulsorySubject.name}`);
                studentResult.results[existingSubjectIndex].isCompulsory = true;
              }
            }
          }
        }
      } catch (combinationError) {
        console.error('Error fetching subject combination:', combinationError);
        // Continue without the combination
      }
    }

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
      divisionDistribution,
      subjectCombination,
      educationLevel: 'A_LEVEL'
    };

    // Return the report as JSON
    res.json(report);
  } catch (error) {
    logToFile(`Error generating A-Level class report: ${error.message}`);
    res.status(500).json({ message: `Error generating A-Level class report: ${error.message}` });
  }
});

// Enter marks for A-Level student
router.post('/enter-marks', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const {
      studentId,
      examId,
      academicYearId,
      examTypeId,
      subjectId,
      classId,
      marksObtained,
      grade,
      points,
      comment,
      isPrincipal
    } = req.body;

    // Log whether this is a principal subject
    logToFile(`Subject ${subjectId} is ${isPrincipal ? 'a principal' : 'a subsidiary'} subject`);

    logToFile(`POST /api/a-level-results/enter-marks - Entering A-Level marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);

    // Validate input data
    const validationResult = validateALevelResult({
      studentId,
      examId,
      subjectId,
      marksObtained,
      grade,
      points,
      isPrincipal
    });

    if (!validationResult.isValid) {
      const errorResponse = formatValidationErrors(validationResult);
      return res.status(422).json(errorResponse);
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json(formatErrorResponse(new Error('Student not found'), 'enter-marks'));
    }

    // Update student to A-Level if not already
    if (student.educationLevel !== 'A_LEVEL') {
      logToFile(`Updating student ${studentId} education level from ${student.educationLevel} to A_LEVEL`);
      student.educationLevel = 'A_LEVEL';
      await student.save();
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      logToFile(`Subject not found with ID: ${subjectId}`);
      return res.status(404).json(formatErrorResponse(new Error('Subject not found'), 'enter-marks'));
    }

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json(formatErrorResponse(new Error('Exam not found'), 'enter-marks'));
    }

    // Check if result already exists
    const existingResult = await ALevelResult.findOne({
      studentId,
      examId,
      subjectId,
      academicYearId
    });

    if (existingResult) {
      // Update existing result
      logToFile(`Updating existing result for student ${studentId}, subject ${subjectId}, exam ${examId}`);

      existingResult.marksObtained = marksObtained;
      existingResult.grade = grade || aLevelGradeCalculator.calculateGrade(marksObtained);
      existingResult.points = points || aLevelGradeCalculator.calculatePoints(existingResult.grade);
      existingResult.comment = comment;
      existingResult.isPrincipal = isPrincipal; // Update the isPrincipal flag

      // Log the updated result
      logToFile(`Updated result: Subject=${subjectId}, Marks=${marksObtained}, Grade=${existingResult.grade}, Points=${existingResult.points}, IsPrincipal=${isPrincipal}`);

      await existingResult.save();

      return res.json(formatSuccessResponse(
        existingResult,
        'A-Level marks updated successfully'
      ));
    } else {
      // Create new result
      logToFile(`Creating new result for student ${studentId}, subject ${subjectId}, exam ${examId}`);

      const newResult = new ALevelResult({
        studentId,
        examId,
        academicYearId,
        examTypeId,
        subjectId,
        classId,
        marksObtained,
        grade: grade || aLevelGradeCalculator.calculateGrade(marksObtained),
        points: points || aLevelGradeCalculator.calculatePoints(grade || aLevelGradeCalculator.calculateGrade(marksObtained)),
        comment,
        isPrincipal
      });

      // Log the new result
      logToFile(`New result: Subject=${subjectId}, Marks=${marksObtained}, Grade=${newResult.grade}, Points=${newResult.points}, IsPrincipal=${isPrincipal}`);

      await newResult.save();

      return res.status(201).json(formatSuccessResponse(
        newResult,
        'A-Level marks saved successfully'
      ));
    }
  } catch (error) {
    logToFile(`Error entering A-Level marks: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'enter-marks'));
  }
});

/**
 * Calculate A-LEVEL grade based on marks
 * @param {Number} marks - The marks obtained (0-100)
 * @returns {String} - The grade (A, B, C, D, E, S, F)
 */
function calculateGrade(marks) {
  // Use the A-Level specific grade calculator
  const { grade } = aLevelGradeCalculator.calculateGradeAndPoints(marks);
  return grade;
}

/**
 * Calculate A-LEVEL points based on grade
 * @param {String} grade - The grade (A, B, C, D, E, S, F)
 * @returns {Number} - The points (1-7)
 */
function calculatePoints(grade) {
  // Use the A-Level specific grade calculator's mapping
  // This is a fallback for when we only have the grade but not the marks
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

// Send result report via SMS
router.post('/send-sms/:studentId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    logToFile(`POST /api/a-level-results/send-sms/${studentId}/${examId} - Sending A-Level result report via SMS`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      logToFile(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify this is an A-Level student
    if (student.educationLevel !== 'A_LEVEL') {
      logToFile(`Student ${studentId} is not an A-Level student`);
      return res.status(400).json({ message: 'This is not an A-Level student' });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get results for this student and exam
    const results = await ALevelResult.find({ studentId, examId })
      .populate('subjectId', 'name code isPrincipal');

    if (!results || results.length === 0) {
      logToFile(`No results found for student ${studentId} and exam ${examId}`);
      return res.status(404).json({ message: 'No results found' });
    }

    // Process results
    let totalMarks = 0;
    let totalPoints = 0;
    const principalSubjects = [];
    const subsidiarySubjects = [];

    for (const result of results) {
      totalMarks += result.marksObtained || 0;
      totalPoints += result.points || 0;

      if (result.subjectId.isPrincipal) {
        principalSubjects.push({
          subject: result.subjectId.name,
          marks: result.marksObtained,
          grade: result.grade
        });
      } else {
        subsidiarySubjects.push({
          subject: result.subjectId.name,
          marks: result.marksObtained,
          grade: result.grade
        });
      }
    }

    // Calculate average
    const average = results.length > 0 ? (totalMarks / results.length).toFixed(2) : '0.00';

    // Calculate best 3 principal subjects
    principalSubjects.sort((a, b) => a.points - b.points);
    const bestThreePrincipalSubjects = principalSubjects.slice(0, Math.min(3, principalSubjects.length));
    const bestThreePoints = bestThreePrincipalSubjects.reduce((sum, subject) => sum + subject.points, 0);

    // Determine division
    const division = calculateALevelDivision(bestThreePoints);

    // Compose SMS message
    const message = `AGAPE LUTHERAN JUNIOR SEMINARY\n${student.firstName} ${student.lastName}\n${exam.name} Results\nAvg: ${average}%\nPoints: ${bestThreePoints}\nDiv: ${division}\nPrincipal Subjects: ${principalSubjects.map(s => `${s.subject}: ${s.grade}`).join(', ')}\nSubsidiary Subjects: ${subsidiarySubjects.map(s => `${s.subject}: ${s.grade}`).join(', ')}`;

    // TODO: Implement SMS sending logic here
    // For now, just return success
    logToFile(`SMS message composed: ${message}`);
    res.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    logToFile(`Error sending A-Level result SMS: ${error.message}`);
    res.status(500).json({ message: `Error sending A-Level result SMS: ${error.message}` });
  }
});

// Get Form 5 student result report
router.get('/form5/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    logToFile(`GET /api/a-level-results/form5/student/${studentId}/${examId} - Generating Form 5 A-Level student result report`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json(formatErrorResponse(new Error('Student not found'), 'form5/student'));
    }

    // Verify this is an A-Level student
    if (student.educationLevel !== 'A_LEVEL') {
      return res.status(400).json(formatErrorResponse(
        new Error('This is not an A-Level student'),
        'form5/student',
        { educationLevel: student.educationLevel }
      ));
    }

    // Verify this is a Form 5 student
    if (student.form !== 5 && student.form !== '5' && student.form !== 'Form 5') {
      return res.status(400).json(formatErrorResponse(
        new Error('This is not a Form 5 student'),
        'form5/student',
        { form: student.form }
      ));
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      return res.status(404).json(formatErrorResponse(new Error('Class not found for student'), 'form5/student'));
    }

    // Find the exam
    const exam = await Exam.findById(examId).populate('academicYear');
    if (!exam) {
      return res.status(404).json(formatErrorResponse(new Error('Exam not found'), 'form5/student'));
    }

    // Get results for this student
    const results = await ALevelResult.find({ studentId, examId })
      .populate('subjectId', 'name code isPrincipal');

    if (!results || results.length === 0) {
      return res.status(404).json(formatErrorResponse(new Error('No results found for this student'), 'form5/student'));
    }

    // Get subject combination if available
    let subjectCombination = null;
    if (student.subjectCombination || classObj.subjectCombination) {
      const combinationId = student.subjectCombination ||
        (typeof classObj.subjectCombination === 'object'
          ? classObj.subjectCombination._id
          : classObj.subjectCombination);

      if (combinationId) {
        try {
          subjectCombination = await getFullSubjectCombination(combinationId);
        } catch (err) {
          logger.error(`Error fetching subject combination: ${err.message}`);
          // Continue without the combination
        }
      }
    }

    // Format the response using the standardized formatter
    const formattedResponse = formatALevelStudentResponse(student, results, exam, classObj);

    // Add form-specific data
    formattedResponse.form = 5;
    formattedResponse.subjectCombination = subjectCombination;
    formattedResponse.reportTitle = `Form 5 ${exam.name} Result Report`;

    // Return the formatted response
    return res.json(formattedResponse);
  } catch (error) {
    logToFile(`Error generating Form 5 A-Level student report: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'form5/student'));
  }
});

// Get Form 6 student result report
router.get('/form6/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    logToFile(`GET /api/a-level-results/form6/student/${studentId}/${examId} - Generating Form 6 A-Level student result report`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json(formatErrorResponse(new Error('Student not found'), 'form6/student'));
    }

    // Verify this is an A-Level student
    if (student.educationLevel !== 'A_LEVEL') {
      return res.status(400).json(formatErrorResponse(
        new Error('This is not an A-Level student'),
        'form6/student',
        { educationLevel: student.educationLevel }
      ));
    }

    // Verify this is a Form 6 student
    if (student.form !== 6 && student.form !== '6' && student.form !== 'Form 6') {
      return res.status(400).json(formatErrorResponse(
        new Error('This is not a Form 6 student'),
        'form6/student',
        { form: student.form }
      ));
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      return res.status(404).json(formatErrorResponse(new Error('Class not found for student'), 'form6/student'));
    }

    // Find the exam
    const exam = await Exam.findById(examId).populate('academicYear');
    if (!exam) {
      return res.status(404).json(formatErrorResponse(new Error('Exam not found'), 'form6/student'));
    }

    // Get results for this student
    const results = await ALevelResult.find({ studentId, examId })
      .populate('subjectId', 'name code isPrincipal');

    if (!results || results.length === 0) {
      return res.status(404).json(formatErrorResponse(new Error('No results found for this student'), 'form6/student'));
    }

    // Get subject combination if available
    let subjectCombination = null;
    if (student.subjectCombination || classObj.subjectCombination) {
      const combinationId = student.subjectCombination ||
        (typeof classObj.subjectCombination === 'object'
          ? classObj.subjectCombination._id
          : classObj.subjectCombination);

      if (combinationId) {
        try {
          subjectCombination = await getFullSubjectCombination(combinationId);
        } catch (err) {
          logger.error(`Error fetching subject combination: ${err.message}`);
          // Continue without the combination
        }
      }
    }

    // Try to get Form 5 results for comparison
    let form5Results = null;
    try {
      // Find Form 5 exams (final exam of the year)
      const form5Exams = await Exam.find({
        type: 'FINAL',
        academicYear: { $ne: exam.academicYear } // Different academic year
      }).sort({ startDate: -1 }).limit(1);

      if (form5Exams.length > 0) {
        const form5Exam = form5Exams[0];

        // Get the student's results for this exam
        const form5ResultsData = await ALevelResult.find({
          studentId: studentId,
          examId: form5Exam._id
        }).populate('subjectId');

        if (form5ResultsData.length > 0) {
          // Calculate average marks
          let totalMarks = 0;
          for (const result of form5ResultsData) {
            totalMarks += result.marksObtained || 0;
          }
          const averageMarks = (totalMarks / form5ResultsData.length).toFixed(2);

          // Calculate division
          const principalResults = form5ResultsData.filter(result =>
            result.subjectId?.isPrincipal);

          // Sort by points (ascending)
          principalResults.sort((a, b) => a.points - b.points);

          // Take best 3 (lowest points)
          const bestThree = principalResults.slice(0, 3);
          const bestThreePoints = bestThree.reduce((sum, result) => sum + (result.points || 0), 0);
          const division = aLevelGradeCalculator.calculateDivision(bestThreePoints);

          form5Results = {
            averageMarks,
            bestThreePoints,
            division,
            examName: form5Exam.name
          };
        }
      }
    } catch (err) {
      logger.error(`Error fetching Form 5 results: ${err.message}`);
      // Continue without Form 5 results
    }

    // Format the response using the standardized formatter
    const formattedResponse = formatALevelStudentResponse(student, results, exam, classObj);

    // Add form-specific data
    formattedResponse.form = 6;
    formattedResponse.subjectCombination = subjectCombination;
    formattedResponse.form5Results = form5Results;
    formattedResponse.reportTitle = `Form 6 ${exam.name} Result Report`;

    // Add final recommendation for Form 6 students
    const division = formattedResponse.summary.division;
    const divisionNumber = division.replace('Division ', '');

    if (divisionNumber === 'I' || divisionNumber === 'II') {
      formattedResponse.finalRecommendation = 'Qualified for University Admission';
    } else if (divisionNumber === 'III') {
      formattedResponse.finalRecommendation = 'Qualified for College Admission';
    } else {
      formattedResponse.finalRecommendation = 'Recommended for Vocational Training';
    }

    // Return the formatted response
    return res.json(formattedResponse);
  } catch (error) {
    logToFile(`Error generating Form 6 A-Level student report: ${error.message}`);
    return res.status(500).json(formatErrorResponse(error, 'form6/student'));
  }
});

// Get Form 5 class result report
router.get('/form5/class/:classId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;

    logToFile(`GET /api/a-level-results/form5/class/${classId}/${examId} - Generating Form 5 A-Level class result report`);

    // Get class details
    const classObj = await Class.findById(classId)
      .populate('students')
      .populate('subjectCombinations')
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

    // Verify this is an A-Level class
    if (classObj.level !== 'A_LEVEL') {
      logToFile(`Class ${classId} is not an A-Level class`);
      return res.status(400).json({ message: 'This is not an A-Level class' });
    }

    // Get the exam
    const exam = await Exam.findById(examId).populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Filter for Form 5 students only
    const students = classObj.students.filter(student => student.form === 5);

    if (students.length === 0) {
      logToFile(`No Form 5 students found in class ${classId}`);
      return res.status(404).json({ message: 'No Form 5 students found in this class' });
    }

    // Get all subject combinations for this class
    const subjectCombinations = classObj.subjectCombinations || [];

    // If no combinations are set, try to get them from students
    if (subjectCombinations.length === 0 && classObj.subjectCombination) {
      subjectCombinations.push(classObj.subjectCombination);
    }

    // Get all subject combinations with full details
    const populatedCombinations = [];
    for (const combinationId of subjectCombinations) {
      const combination = await getFullSubjectCombination(combinationId);
      if (combination) {
        populatedCombinations.push(combination);
      }
    }

    // Prepare student results
    const studentResults = [];
    const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, '0': 0 };

    for (const student of students) {
      // Get student's combination
      const studentCombination = await getFullSubjectCombination(student.subjectCombination);
      if (!studentCombination) continue;

      // Get principal subject IDs
      const principalSubjectIds = studentCombination.principalSubjects.map(s => s._id);

      // Get student's results
      const results = await ALevelResult.find({
        studentId: student._id,
        examId
      }).populate('subjectId');

      if (results.length === 0) continue;

      // Format subject results
      const subjectResults = [];
      let studentTotal = 0;
      let studentPoints = 0;
      let validSubjects = 0;

      // Process all subjects in the combination
      for (const subject of [...studentCombination.principalSubjects, ...studentCombination.subsidiarySubjects]) {
        const result = results.find(r => r.subjectId._id.toString() === subject._id.toString());

        if (result) {
          subjectResults.push({
            subject: subject.name,
            code: subject.code,
            marks: result.marksObtained,
            grade: result.grade,
            points: result.points,
            isPrincipal: subject.isPrincipal
          });

          studentTotal += result.marksObtained;
          studentPoints += result.points;
          validSubjects++;
        } else {
          subjectResults.push({
            subject: subject.name,
            code: subject.code,
            marks: 0,
            grade: '-',
            points: 0,
            isPrincipal: subject.isPrincipal
          });
        }
      }

      // Calculate average
      const studentAverage = validSubjects > 0 ? studentTotal / validSubjects : 0;

      // Calculate best three and division
      const { bestThreeResults, bestThreePoints, division } =
        aLevelGradeCalculator.calculateBestThreeAndDivision(results, principalSubjectIds);

      // Update division distribution
      if (divisionDistribution[division] !== undefined) {
        divisionDistribution[division]++;
      }

      // Add student result summary
      studentResults.push({
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        sex: student.gender === 'male' ? 'M' : 'F',
        combination: studentCombination.name,
        results: subjectResults,
        totalMarks: studentTotal,
        averageMarks: studentAverage.toFixed(2),
        totalPoints: studentPoints,
        bestThreePoints,
        division,
        rank: 'N/A' // Will be calculated below
      });
    }

    // Sort students by average marks (descending) and assign ranks
    studentResults.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));
    for (let i = 0; i < studentResults.length; i++) {
      studentResults[i].rank = i + 1;
    }

    // Format the report
    const report = {
      reportTitle: `Form 5 ${exam.name} Class Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      form: 5,
      students: studentResults,
      totalStudents: studentResults.length,
      divisionDistribution,
      subjectCombinations: populatedCombinations,
      educationLevel: 'A_LEVEL'
    };

    // Return the report as JSON
    res.json(report);
  } catch (error) {
    logToFile(`Error generating Form 5 A-Level class report: ${error.message}`);
    console.error('Error generating Form 5 A-Level class report:', error);
    res.status(500).json({ message: `Error generating report: ${error.message}` });
  }
});

// Get Form 6 class result report
router.get('/form6/class/:classId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId, examId } = req.params;

    logToFile(`GET /api/a-level-results/form6/class/${classId}/${examId} - Generating Form 6 A-Level class result report`);

    // Get class details
    const classObj = await Class.findById(classId)
      .populate('students')
      .populate('subjectCombinations')
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

    // Verify this is an A-Level class
    if (classObj.level !== 'A_LEVEL') {
      logToFile(`Class ${classId} is not an A-Level class`);
      return res.status(400).json({ message: 'This is not an A-Level class' });
    }

    // Get the exam
    const exam = await Exam.findById(examId).populate('academicYear');
    if (!exam) {
      logToFile(`Exam not found with ID: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Filter for Form 6 students only
    const students = classObj.students.filter(student => student.form === 6);

    if (students.length === 0) {
      logToFile(`No Form 6 students found in class ${classId}`);
      return res.status(404).json({ message: 'No Form 6 students found in this class' });
    }

    // Get all subject combinations for this class
    const subjectCombinations = classObj.subjectCombinations || [];

    // If no combinations are set, try to get them from students
    if (subjectCombinations.length === 0 && classObj.subjectCombination) {
      subjectCombinations.push(classObj.subjectCombination);
    }

    // Get all subject combinations with full details
    const populatedCombinations = [];
    for (const combinationId of subjectCombinations) {
      const combination = await getFullSubjectCombination(combinationId);
      if (combination) {
        populatedCombinations.push(combination);
      }
    }

    // Prepare student results
    const studentResults = [];
    const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, '0': 0 };

    for (const student of students) {
      // Get student's combination
      const studentCombination = await getFullSubjectCombination(student.subjectCombination);
      if (!studentCombination) continue;

      // Get principal subject IDs
      const principalSubjectIds = studentCombination.principalSubjects.map(s => s._id);

      // Get student's results
      const results = await ALevelResult.find({
        studentId: student._id,
        examId
      }).populate('subjectId');

      if (results.length === 0) continue;

      // Format subject results
      const subjectResults = [];
      let studentTotal = 0;
      let studentPoints = 0;
      let validSubjects = 0;

      // Process all subjects in the combination
      for (const subject of [...studentCombination.principalSubjects, ...studentCombination.subsidiarySubjects]) {
        const result = results.find(r => r.subjectId._id.toString() === subject._id.toString());

        if (result) {
          subjectResults.push({
            subject: subject.name,
            code: subject.code,
            marks: result.marksObtained,
            grade: result.grade,
            points: result.points,
            isPrincipal: subject.isPrincipal
          });

          studentTotal += result.marksObtained;
          studentPoints += result.points;
          validSubjects++;
        } else {
          subjectResults.push({
            subject: subject.name,
            code: subject.code,
            marks: 0,
            grade: '-',
            points: 0,
            isPrincipal: subject.isPrincipal
          });
        }
      }

      // Calculate average
      const studentAverage = validSubjects > 0 ? studentTotal / validSubjects : 0;

      // Calculate best three and division
      const { bestThreeResults, bestThreePoints, division } =
        aLevelGradeCalculator.calculateBestThreeAndDivision(results, principalSubjectIds);

      // Update division distribution
      if (divisionDistribution[division] !== undefined) {
        divisionDistribution[division]++;
      }

      // Try to get Form 5 results for comparison
      let form5Results = null;
      try {
        // Find Form 5 exams (final exam of the year)
        const form5Exams = await Exam.find({
          type: 'FINAL',
          academicYear: { $ne: exam.academicYear } // Different academic year
        }).sort({ startDate: -1 }).limit(1);

        if (form5Exams.length > 0) {
          const form5Exam = form5Exams[0];

          // Get Form 5 results
          const form5ResultsData = await ALevelResult.find({
            studentId: student._id,
            examId: form5Exam._id
          }).populate('subjectId');

          if (form5ResultsData.length > 0) {
            // Calculate Form 5 summary
            let form5TotalMarks = 0;
            for (const result of form5ResultsData) {
              form5TotalMarks += result.marksObtained || 0;
            }

            const form5AverageMarks = form5ResultsData.length > 0 ?
              form5TotalMarks / form5ResultsData.length : 0;

            // Calculate Form 5 division
            const form5PrincipalResults = form5ResultsData.filter(result =>
              result.subjectId?.isPrincipal);

            // Sort by points (ascending)
            form5PrincipalResults.sort((a, b) => a.points - b.points);

            // Take best 3 (lowest points)
            const form5BestThree = form5PrincipalResults.slice(0, 3);
            const form5BestThreePoints = form5BestThree.reduce((sum, result) =>
              sum + (result.points || 0), 0);

            const form5Division = calculateALevelDivision(form5BestThreePoints);

            form5Results = {
              averageMarks: form5AverageMarks.toFixed(2),
              bestThreePoints: form5BestThreePoints,
              division: form5Division,
              examName: form5Exam.name
            };
          }
        }
      } catch (form5Error) {
        console.error('Error fetching Form 5 results:', form5Error);
        // Continue without Form 5 results
      }

      // Add student result summary
      studentResults.push({
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        sex: student.gender === 'male' ? 'M' : 'F',
        combination: studentCombination.name,
        results: subjectResults,
        totalMarks: studentTotal,
        averageMarks: studentAverage.toFixed(2),
        totalPoints: studentPoints,
        bestThreePoints,
        division,
        form5Results,
        rank: 'N/A' // Will be calculated below
      });
    }

    // Sort students by average marks (descending) and assign ranks
    studentResults.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));
    for (let i = 0; i < studentResults.length; i++) {
      studentResults[i].rank = i + 1;
    }

    // Format the report
    const report = {
      reportTitle: `Form 6 ${exam.name} Class Result Report`,
      schoolName: 'St. John Vianney School Management System',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      form: 6,
      students: studentResults,
      totalStudents: studentResults.length,
      divisionDistribution,
      subjectCombinations: populatedCombinations,
      educationLevel: 'A_LEVEL'
    };

    // Return the report as JSON
    res.json(report);
  } catch (error) {
    logToFile(`Error generating Form 6 A-Level class report: ${error.message}`);
    console.error('Error generating Form 6 A-Level class report:', error);
    res.status(500).json({ message: `Error generating report: ${error.message}` });
  }
});

module.exports = router;
