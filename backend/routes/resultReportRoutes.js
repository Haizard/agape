const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Import models
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const AcademicYear = require('../models/AcademicYear');
const Teacher = require('../models/Teacher');

// Helper function to get remarks based on grade
function getRemarks(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'F': return 'Fail';
    default: return 'N/A';
  }
}

// Get student result report
router.get('/student/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/results/report/student/${req.params.studentId}/${req.params.examId} - Generating student result report`);

    // Find all results for this student and exam - try both field naming conventions
    const results = await Result.find({
      $or: [
        { studentId: req.params.studentId, examId: req.params.examId },
        { student: req.params.studentId, exam: req.params.examId }
      ]
    })
    .populate('studentId', 'firstName lastName rollNumber gender')
    .populate('student', 'firstName lastName rollNumber gender')
    .populate('classId', 'name section stream')
    .populate('class', 'name section stream')
    .populate('examId', 'name type startDate endDate')
    .populate('exam', 'name type startDate endDate')
    .populate('academicYearId', 'name')
    .populate('academicYear', 'name')
    .populate('subjectId', 'name code')
    .populate('subject', 'name code')
    .populate('examTypeId', 'name maxMarks')
    .populate('examType', 'name maxMarks')
    .sort({ 'subjectId': 1 }); // Sort by subject ID to ensure consistent ordering

    console.log(`Found ${results.length} results for student ${req.params.studentId} and exam ${req.params.examId}`);

    if (results.length === 0) {
      console.log(`No results found for student ${req.params.studentId} and exam ${req.params.examId}`);
      return res.status(404).json({ message: 'No results found for this student and exam' });
    }

    // Get student details
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      console.log(`Student not found with ID: ${req.params.studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get exam details
    const exam = await Exam.findById(req.params.examId)
      .populate('examType')
      .populate('academicYear');
    if (!exam) {
      console.log(`Exam not found with ID: ${req.params.examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get class details
    const classObj = await Class.findById(student.class);
    if (!classObj) {
      console.log(`Class not found for student ${req.params.studentId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Process subject results
    const subjectResults = [];
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalMarks = 0;
    let totalPoints = 0;
    let totalSubjects = 0;

    for (const result of results) {
      // Get subject details - handle both naming conventions
      const subject = result.subject || result.subjectId;
      if (!subject || !subject.name) continue;

      // Use pre-calculated grade and points or calculate them
      let grade = result.grade || 'F';
      let points = result.points || 5;

      // Update grade distribution
      if (gradeDistribution[grade] !== undefined) {
        gradeDistribution[grade]++;
      }

      // Update totals
      totalMarks += result.marksObtained || 0;
      totalPoints += points;
      totalSubjects++;

      // Add to subject results
      subjectResults.push({
        subject: subject.name,
        marks: result.marksObtained || 0, // Ensure marks is a number, not undefined
        grade,
        points,
        remarks: getRemarks(grade)
      });
    }

    // Calculate averages and division
    const averageMarks = totalSubjects > 0 ? totalMarks / totalSubjects : 0;

    // Sort subject results by points (best subjects first)
    subjectResults.sort((a, b) => a.points - b.points);

    // Calculate best seven points (Tanzania's CSEE division calculation)
    const bestSevenPoints = subjectResults.slice(0, 7).reduce((sum, subject) => sum + subject.points, 0);

    // Determine division based on best seven points
    let division = 'Division 0';
    if (bestSevenPoints >= 7 && bestSevenPoints <= 14) {
      division = 'Division I';
    } else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) {
      division = 'Division II';
    } else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) {
      division = 'Division III';
    } else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) {
      division = 'Division IV';
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney Secondary School',
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
      // Add these fields for compatibility with the PDF generator
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
      // These fields are used by the PDF generator
      results: subjectResults.map(result => ({
        subject: result.subject,
        marks: result.marks,
        grade: result.grade,
        points: result.points,
        remarks: result.remarks
      })),
      totalMarks: totalMarks,
      averageMarks: averageMarks.toFixed(2),
      points: totalPoints,
      bestSevenPoints: bestSevenPoints,
      division: division,
      grade: division.replace('Division ', '')
    };

    console.log('Generated student result report successfully');
    res.json(report);
  } catch (error) {
    console.error('Error generating student result report:', error);
    res.status(500).json({
      message: 'Error generating student result report',
      error: error.message
    });
  }
});

// Get class result report
router.get('/class/:classId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log(`GET /api/results/report/class/${req.params.classId}/${req.params.examId} - Generating class result report`);

    // Find the class
    const classData = await Class.findById(req.params.classId)
      .populate('students')
      .populate({
        path: 'subjects.subject',
        model: 'Subject'
      })
      .populate({
        path: 'subjects.teacher',
        model: 'Teacher'
      })
      .populate('academicYear')
      .populate('classTeacher');

    if (!classData) {
      console.log(`Class not found with ID: ${req.params.classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find the exam
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      console.log(`Exam not found with ID: ${req.params.examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get results for all students in the class for this exam - try both field naming conventions
    const results = await Result.find({
      $or: [
        { classId: req.params.classId, examId: req.params.examId },
        { class: req.params.classId, exam: req.params.examId }
      ]
    })
      .populate('studentId', 'firstName lastName rollNumber gender')
      .populate('student', 'firstName lastName rollNumber gender')
      .populate('subjectId', 'name')
      .populate('subject', 'name');

    if (results.length === 0) {
      console.log(`No results found for class ${req.params.classId} and exam ${req.params.examId}`);
      return res.status(404).json({ message: 'No results found for this class and exam' });
    }

    // Initialize subject statistics based on results
    const subjectStats = {};
    const allSubjects = new Set();

    // Process results to collect all subjects
    results.forEach(result => {
      const subject = result.subject || result.subjectId;
      if (subject && subject._id) {
        const subjectId = subject._id.toString();
        allSubjects.add(subjectId);
      }
    });

    // Initialize statistics for each subject
    allSubjects.forEach(subjectId => {
      // Find the subject in the results
      const result = results.find(r => {
        const subject = r.subject || r.subjectId;
        return subject && subject._id && subject._id.toString() === subjectId;
      });

      if (result) {
        const subject = result.subject || result.subjectId;
        subjectStats[subjectId] = {
          name: subject.name,
          totalMarks: 0,
          studentCount: 0,
          averageMarks: 0,
          grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          highestMarks: 0,
          lowestMarks: 100
        };
      }
    });

    // Group results by student
    const studentResultsMap = {};
    results.forEach(result => {
      const student = result.student || result.studentId;
      if (!student || !student._id) return;

      const studentId = student._id.toString();
      const subject = result.subject || result.subjectId;

      if (!subject || !subject._id) return;

      const subjectId = subject._id.toString();
      const marks = result.marksObtained || 0;
      const grade = result.grade || 'F';
      const points = result.points || 5;

      // Update subject statistics
      if (subjectStats[subjectId]) {
        subjectStats[subjectId].totalMarks += marks;
        subjectStats[subjectId].studentCount++;
        subjectStats[subjectId].grades[grade]++;
        subjectStats[subjectId].highestMarks = Math.max(subjectStats[subjectId].highestMarks, marks);
        subjectStats[subjectId].lowestMarks = Math.min(subjectStats[subjectId].lowestMarks, marks);
      }

      // Initialize student result if not exists
      if (!studentResultsMap[studentId]) {
        studentResultsMap[studentId] = {
          studentId,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          subjects: {},
          totalMarks: 0,
          totalPoints: 0,
          subjectCount: 0
        };
      }

      // Add subject result to student
      studentResultsMap[studentId].subjects[subjectId] = {
        name: subject.name,
        marks,
        grade,
        points
      };

      // Update student totals
      studentResultsMap[studentId].totalMarks += marks;
      studentResultsMap[studentId].totalPoints += points;
      studentResultsMap[studentId].subjectCount++;
    });

    // Convert student results map to array and calculate averages and divisions
    const studentResults = Object.values(studentResultsMap).map(student => {
      // Calculate student average
      const averageMarks = student.subjectCount > 0 ? student.totalMarks / student.subjectCount : 0;

      // Get subject results as array
      const subjectResults = Object.values(student.subjects);

      // Sort subject results by points (best subjects first)
      subjectResults.sort((a, b) => a.points - b.points);

      // Calculate best seven points (Tanzania's CSEE division calculation)
      const bestSevenPoints = subjectResults.slice(0, 7).reduce((sum, subject) => sum + subject.points, 0);

      // Determine division based on best seven points
      let division = 'Division 0';
      if (bestSevenPoints >= 7 && bestSevenPoints <= 14) {
        division = 'Division I';
      } else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) {
        division = 'Division II';
      } else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) {
        division = 'Division III';
      } else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) {
        division = 'Division IV';
      }

      return {
        studentId: student.studentId,
        name: student.name,
        rollNumber: student.rollNumber,
        totalMarks: student.totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints: student.totalPoints,
        bestSevenPoints,
        division,
        rank: 'N/A' // Will be calculated later
      };
    });

    // Calculate averages for each subject
    Object.keys(subjectStats).forEach(subjectId => {
      const stats = subjectStats[subjectId];
      if (stats.studentCount > 0) {
        stats.averageMarks = (stats.totalMarks / stats.studentCount).toFixed(2);
      }
    });

    // Sort students by average marks for ranking
    studentResults.sort((a, b) => b.averageMarks - a.averageMarks);

    // Assign ranks
    studentResults.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Format the report
    const report = {
      reportTitle: `${exam.name} Class Result Report`,
      schoolName: 'St. John Vianney Secondary School',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      classDetails: {
        name: `${classData.name} ${classData.section || ''} ${classData.stream || ''}`.trim(),
        totalStudents: classData.students ? classData.students.length : 0,
        classTeacher: classData.classTeacher ?
          `${classData.classTeacher.firstName} ${classData.classTeacher.lastName}` : 'N/A'
      },
      subjectStatistics: Object.values(subjectStats),
      studentResults: studentResults,
      summary: {
        classAverage: studentResults.length > 0 ?
          (studentResults.reduce((sum, student) => sum + parseFloat(student.averageMarks), 0) / studentResults.length).toFixed(2) :
          '0.00',
        divisions: {
          'Division I': studentResults.filter(student => student.division === 'Division I').length,
          'Division II': studentResults.filter(student => student.division === 'Division II').length,
          'Division III': studentResults.filter(student => student.division === 'Division III').length,
          'Division IV': studentResults.filter(student => student.division === 'Division IV').length,
          'Division 0': studentResults.filter(student => student.division === 'Division 0').length
        }
      },
      // Add these fields for compatibility with the PDF generator
      class: {
        name: classData.name,
        section: classData.section || '',
        stream: classData.stream || '',
        fullName: `${classData.name} ${classData.section || ''} ${classData.stream || ''}`.trim()
      },
      exam: {
        name: exam.name,
        term: exam.term || 'Term 1'
      },
      // Convert student results to the format expected by the PDF generator
      students: studentResults.map(student => ({
        id: student.studentId,
        name: student.name,
        rollNumber: student.rollNumber,
        results: Object.values(student.subjects).map(subject => ({
          subject: { name: subject.name },
          subjectId: { name: subject.name },
          marksObtained: subject.marks || 0,
          marks: subject.marks || 0,
          grade: subject.grade || 'F',
          points: subject.points || 5
        })),
        totalMarks: student.totalMarks || 0,
        averageMarks: student.averageMarks || '0.00',
        totalPoints: student.totalPoints || 0,
        bestSevenPoints: student.bestSevenPoints || 0,
        division: student.division || 'Division 0'
      }))
    };

    console.log('Generated class result report successfully');
    res.json(report);
  } catch (error) {
    console.error('Error generating class result report:', error);
    res.status(500).json({
      message: 'Error generating class result report',
      error: error.message
    });
  }
});

// Get teacher's subjects results
router.get('/teacher/subjects', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    console.log('GET /api/results/report/teacher/subjects - Generating teacher subjects results');

    // Get the teacher profile
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) {
      console.log(`Teacher profile not found for user ID: ${req.user.userId}`);
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Find classes where this teacher teaches subjects
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
      .populate('academicYear')
      .populate({
        path: 'subjects.subject',
        model: 'Subject'
      });

    if (classes.length === 0) {
      console.log(`No classes found where teacher ${teacher._id} teaches subjects`);
      return res.status(404).json({ message: 'No classes found where you teach subjects' });
    }

    // Get the latest exam
    const latestExam = await Exam.findOne().sort({ startDate: -1 });
    if (!latestExam) {
      console.log('No exams found');
      return res.status(404).json({ message: 'No exams found' });
    }

    // Prepare the report data
    const subjectsReport = [];

    for (const classData of classes) {
      // Find subjects taught by this teacher in this class
      const teacherSubjects = classData.subjects.filter(
        subject => subject.teacher && subject.teacher.toString() === teacher._id.toString()
      );

      if (teacherSubjects.length === 0) continue;

      // Get results for this class and exam
      const results = await Result.find({
        class: classData._id,
        exam: latestExam._id
      }).populate('student');

      if (results.length === 0) continue;

      // Process each subject
      for (const subjectData of teacherSubjects) {
        if (!subjectData.subject) continue;

        const subjectStats = {
          subject: subjectData.subject.name,
          class: `${classData.name} ${classData.section || ''} ${classData.stream || ''}`.trim(),
          academicYear: classData.academicYear ? classData.academicYear.name : 'N/A',
          exam: latestExam.name,
          totalStudents: results.length,
          grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          highestMarks: 0,
          lowestMarks: 100,
          averageMarks: 0,
          totalMarks: 0,
          studentResults: []
        };

        // Process each student's result for this subject
        for (const result of results) {
          const subjectResult = result.subjects.find(
            s => s.subject && s.subject.toString() === subjectData.subject._id.toString()
          );

          if (subjectResult && result.student) {
            // Update subject statistics
            subjectStats.grades[subjectResult.grade]++;
            subjectStats.highestMarks = Math.max(subjectStats.highestMarks, subjectResult.marks);
            subjectStats.lowestMarks = Math.min(subjectStats.lowestMarks, subjectResult.marks);
            subjectStats.totalMarks += subjectResult.marks;

            // Add student result
            subjectStats.studentResults.push({
              name: `${result.student.firstName} ${result.student.lastName}`,
              rollNumber: result.student.rollNumber,
              marks: subjectResult.marks,
              grade: subjectResult.grade,
              points: subjectResult.points,
              remarks: getRemarks(subjectResult.grade)
            });
          }
        }

        // Calculate average marks
        if (subjectStats.studentResults.length > 0) {
          subjectStats.averageMarks = (subjectStats.totalMarks / subjectStats.studentResults.length).toFixed(2);

          // Sort student results by marks (descending)
          subjectStats.studentResults.sort((a, b) => b.marks - a.marks);

          // Add to report
          subjectsReport.push(subjectStats);
        }
      }
    }

    if (subjectsReport.length === 0) {
      console.log(`No results found for subjects taught by teacher ${teacher._id}`);
      return res.status(404).json({ message: 'No results found for subjects you teach' });
    }

    console.log('Generated teacher subjects results successfully');
    res.json(subjectsReport);
  } catch (error) {
    console.error('Error generating teacher subjects results:', error);
    res.status(500).json({
      message: 'Error generating teacher subjects results',
      error: error.message
    });
  }
});

// Send result report via SMS
router.post('/send-sms/:studentId/:examId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log(`POST /api/results/report/send-sms/${req.params.studentId}/${req.params.examId} - Sending result report via SMS`);

    // Find the result
    const result = await Result.findOne({
      student: req.params.studentId,
      exam: req.params.examId
    })
      .populate('student')
      .populate('class')
      .populate('exam')
      .populate('academicYear');

    if (!result) {
      console.log(`No result found for student ${req.params.studentId} and exam ${req.params.examId}`);
      return res.status(404).json({ message: 'Result not found' });
    }

    // Get student details
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      console.log(`Student not found with ID: ${req.params.studentId}`);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if parent contact is available
    if (!student.parentContact) {
      console.log(`Parent contact not available for student ${req.params.studentId}`);
      return res.status(400).json({ message: 'Parent contact information not available' });
    }

    // Format the SMS message
    const smsMessage = `
      ${result.exam.name} Result for ${student.firstName} ${student.lastName}
      Class: ${result.class.name} ${result.class.section || ''} ${result.class.stream || ''}
      Average: ${result.averageMarks.toFixed(2)}
      Division: ${result.division}
      Total Points: ${result.totalPoints}
      St. John Vianney Secondary School
    `;

    // TODO: Implement SMS sending using Africa's Talking API
    // For now, just log the message
    console.log('SMS Message:', smsMessage);
    console.log('Would send to:', student.parentContact);

    res.json({
      message: 'SMS sent successfully',
      recipient: student.parentContact,
      smsContent: smsMessage
    });
  } catch (error) {
    console.error('Error sending result report via SMS:', error);
    res.status(500).json({
      message: 'Error sending result report via SMS',
      error: error.message
    });
  }
});

module.exports = router;

