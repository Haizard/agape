const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const ALevelResult = require('../models/ALevelResult');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// Helper function to calculate division based on points
function calculateDivision(points) {
  if (points >= 18) return 'I';
  if (points >= 15) return 'II';
  if (points >= 12) return 'III';
  if (points >= 9) return 'IV';
  if (points >= 7) return 'V';
  return 'F';
}

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
    default: return 'N/A';
  }
}

// Get comprehensive student result report
router.get('/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/results/comprehensive/student/${req.params.studentId}/${req.params.examId} - Generating comprehensive student result report`);

    const { studentId, examId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid student or exam ID' });
    }

    // Find the student
    const student = await Student.findById(studentId)
      .populate('class')
      .populate('subjectCombination');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the exam
    const exam = await Exam.findById(examId)
      .populate('academicYear')
      .populate('examType');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find the class
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Determine education level
    const educationLevel = classObj.educationLevel || 'A_LEVEL';

    // Find all results for this student and exam
    const results = await ALevelResult.find({
      student: studentId,
      exam: examId
    }).populate('subject');

    if (results.length === 0) {
      // Return empty template if no results found
      return res.status(200).json({
        reportTitle: `${exam.name} Result Report`,
        schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
        academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
        examName: exam.name,
        examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
        educationLevel,
        studentDetails: {
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: classObj.name,
          form: student.form,
          gender: student.gender,
          subjectCombination: student.subjectCombination ? student.subjectCombination.name : 'N/A'
        },
        principalSubjects: [],
        subsidiarySubjects: [],
        summary: {
          totalMarks: 0,
          averageMarks: 0,
          totalPoints: 0,
          bestThreePoints: 0,
          division: 'N/A',
          rank: 'N/A',
          totalStudents: 0
        }
      });
    }

    // Get all subjects for this student
    const studentSubjects = await Subject.find({
      _id: { $in: results.map(r => r.subject) }
    });

    // Separate principal and subsidiary subjects
    const principalSubjects = [];
    const subsidiarySubjects = [];

    // Process results
    let totalMarks = 0;
    let totalPoints = 0;
    let subjectCount = 0;

    for (const result of results) {
      const subject = studentSubjects.find(s => s._id.toString() === result.subject.toString());
      
      if (!subject) continue;

      const subjectData = {
        subject: subject.name,
        code: subject.code,
        marks: result.marks,
        grade: result.grade,
        points: result.points,
        remarks: getRemarks(result.grade)
      };

      // Determine if this is a principal or subsidiary subject
      if (subject.isSubsidiary) {
        subsidiarySubjects.push(subjectData);
      } else {
        principalSubjects.push(subjectData);
        totalMarks += result.marks;
        totalPoints += result.points;
        subjectCount++;
      }
    }

    // Calculate average marks
    const averageMarks = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(2) : 0;

    // Calculate best three subjects (for Form 5)
    const sortedPrincipalSubjects = [...principalSubjects].sort((a, b) => b.points - a.points);
    const bestThreePoints = sortedPrincipalSubjects.slice(0, 3).reduce((sum, subject) => sum + subject.points, 0);

    // Calculate division
    const division = calculateDivision(totalPoints);

    // Get total students in the class for ranking
    const totalStudents = await Student.countDocuments({ class: student.class });

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      educationLevel,
      exam: {
        id: exam._id,
        name: exam.name,
        type: exam.type,
        term: exam.term
      },
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: classObj.name,
        form: student.form,
        gender: student.gender,
        subjectCombination: student.subjectCombination ? student.subjectCombination.name : 'N/A'
      },
      principalSubjects,
      subsidiarySubjects,
      summary: {
        totalMarks,
        averageMarks,
        totalPoints,
        bestThreePoints,
        division,
        rank: 'N/A', // Would require comparing with other students
        totalStudents
      }
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating comprehensive student report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Get PDF version of the report
router.get('/student/:studentId/:examId/pdf', authenticateToken, async (req, res) => {
  try {
    // This endpoint would generate a PDF version of the report
    // For now, we'll redirect to the JSON endpoint
    res.redirect(`/api/results/comprehensive/student/${req.params.studentId}/${req.params.examId}`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Error generating PDF report', error: error.message });
  }
});

module.exports = router;
