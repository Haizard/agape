const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

// Import PDF generators
const { generateStudentResultPDF } = require('../utils/studentReportPdfGenerator');
const { generateClassResultPDF } = require('../utils/classReportPdfGenerator');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

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

async function testPdfGenerators() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Test student result PDF
    await testStudentResultPDF();

    // Test class result PDF
    await testClassResultPDF();
  } catch (error) {
    console.error('Error testing PDF generators:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

async function testStudentResultPDF() {
  try {
    console.log('Testing student result PDF generator...');

    // Get the student
    const studentId = '67ee9fcefc46e8d35a4b66fb'; // Khadija Kileo
    const student = await Student.findById(studentId);
    if (!student) {
      console.log(`Student not found with ID: ${studentId}`);
      return;
    }
    console.log(`Found student: ${student.firstName} ${student.lastName}`);

    // Get the class
    const classId = student.class;
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`Class not found with ID: ${classId}`);
      return;
    }
    console.log(`Found class: ${classObj.name}`);

    // Get the exam
    const examId = '67eeab8e963c1a1685e8d859'; // Default Exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.log(`Exam not found with ID: ${examId}`);
      return;
    }
    console.log(`Found exam: ${exam.name}`);

    // Get the results for this student and exam
    const results = await Result.find({ 
      $or: [
        { studentId: studentId, examId: examId },
        { student: studentId, exam: examId }
      ]
    })
    .populate('subjectId')
    .populate('subject');

    console.log(`Found ${results.length} results for student ${student.firstName} ${student.lastName} and exam ${exam.name}`);

    // Process the results
    const subjectResults = [];
    let totalMarks = 0;
    let totalPoints = 0;
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    for (const result of results) {
      const subject = result.subject || result.subjectId;
      if (!subject) continue;

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

      // Add to subject results
      subjectResults.push({
        subject: subject.name,
        marks: result.marksObtained || 0,
        grade,
        points,
        remarks: getRemarks(grade)
      });
    }

    // Calculate averages
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

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
      academicYear: '2023-2024',
      examName: exam.name,
      examDate: exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A',
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: 'Form 1',
        gender: student.gender
      },
      subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        division,
        rank: 'N/A',
        gradeDistribution
      },
      student: {
        fullName: `${student.firstName} ${student.lastName}`,
        sex: student.gender === 'Male' ? 'M' : 'F'
      },
      class: {
        fullName: `Form 1`
      },
      exam: {
        name: exam.name,
        term: 'Term 1'
      },
      results: subjectResults,
      totalMarks,
      averageMarks: averageMarks.toFixed(2),
      points: totalPoints,
      bestSevenPoints,
      division
    };

    // Create a write stream for the PDF
    const outputPath = path.join(__dirname, 'student_result.pdf');
    const writeStream = fs.createWriteStream(outputPath);

    // Create a mock response object
    const mockRes = {
      setHeader: () => {},
      on: (event, callback) => {
        if (event === 'finish') {
          callback();
        }
      },
      once: () => {},
      emit: () => {}
    };

    // Pipe the PDF to the write stream
    writeStream.on('finish', () => {
      console.log(`Student result PDF generated at: ${outputPath}`);
    });

    // Generate the PDF
    generateStudentResultPDF(report, writeStream);
  } catch (error) {
    console.error('Error testing student result PDF:', error);
  }
}

async function testClassResultPDF() {
  try {
    console.log('Testing class result PDF generator...');

    // Get the class
    const classId = '67ee9fcdfc46e8d35a4b66bd'; // Form 1
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`Class not found with ID: ${classId}`);
      return;
    }
    console.log(`Found class: ${classObj.name}`);

    // Get the exam
    const examId = '67eeab8e963c1a1685e8d859'; // Default Exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.log(`Exam not found with ID: ${examId}`);
      return;
    }
    console.log(`Found exam: ${exam.name}`);

    // Get all students in the class
    const students = await Student.find({ class: classId });
    console.log(`Found ${students.length} students in class ${classObj.name}`);

    // Get all subjects
    const subjects = await Subject.find();
    console.log(`Found ${subjects.length} subjects`);

    // Initialize subject statistics
    const subjectStats = {};
    subjects.forEach(subject => {
      subjectStats[subject._id.toString()] = {
        name: subject.name,
        totalMarks: 0,
        studentCount: 0,
        averageMarks: 0,
        grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        highestMarks: 0,
        lowestMarks: 100
      };
    });

    // Get results for all students in the class for this exam
    const results = await Result.find({
      $or: [
        { classId: classId, examId: examId },
        { class: classId, exam: examId }
      ]
    })
      .populate('studentId', 'firstName lastName rollNumber gender')
      .populate('student', 'firstName lastName rollNumber gender')
      .populate('subjectId', 'name')
      .populate('subject', 'name');

    console.log(`Found ${results.length} results for class ${classObj.name} and exam ${exam.name}`);

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
          sex: student.gender === 'Male' ? 'M' : 'F',
          subjects: [],
          totalMarks: 0,
          totalPoints: 0,
          subjectCount: 0
        };
      }
      
      // Add subject result to student
      studentResultsMap[studentId].subjects.push({
        name: subject.name,
        marks,
        grade,
        points
      });
      
      // Update student totals
      studentResultsMap[studentId].totalMarks += marks;
      studentResultsMap[studentId].totalPoints += points;
      studentResultsMap[studentId].subjectCount++;
    });
    
    // Calculate averages for subjects
    Object.keys(subjectStats).forEach(subjectId => {
      const stats = subjectStats[subjectId];
      if (stats.studentCount > 0) {
        stats.averageMarks = (stats.totalMarks / stats.studentCount).toFixed(2);
      }
    });
    
    // Convert student results map to array and calculate averages and divisions
    const studentSummaries = Object.values(studentResultsMap).map(student => {
      // Calculate student average
      const averageMarks = student.subjectCount > 0 ? student.totalMarks / student.subjectCount : 0;
      
      // Sort subject results by points (best subjects first)
      student.subjects.sort((a, b) => a.points - b.points);
      
      // Calculate best seven points (Tanzania's CSEE division calculation)
      const bestSevenPoints = student.subjects.slice(0, 7).reduce((sum, subject) => sum + subject.points, 0);
      
      // Determine division based on best seven points
      let division = '0';
      if (bestSevenPoints >= 7 && bestSevenPoints <= 14) {
        division = 'I';
      } else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) {
        division = 'II';
      } else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) {
        division = 'III';
      } else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) {
        division = 'IV';
      }
      
      return {
        ...student,
        averageMarks: averageMarks.toFixed(2),
        bestSevenPoints,
        division
      };
    });
    
    // Sort students by average marks for ranking
    studentSummaries.sort((a, b) => parseFloat(b.averageMarks) - parseFloat(a.averageMarks));
    
    // Assign ranks
    studentSummaries.forEach((summary, index) => {
      summary.rank = index + 1;
    });
    
    // Calculate class average
    const classAverage = studentSummaries.length > 0
      ? studentSummaries.reduce((sum, s) => sum + parseFloat(s.averageMarks), 0) / studentSummaries.length
      : 0;
    
    // Count divisions
    const divisionCounts = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      '0': 0
    };
    
    studentSummaries.forEach(summary => {
      divisionCounts[summary.division]++;
    });

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney Secondary School',
      academicYear: '2023-2024',
      examName: exam.name,
      examDate: exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'N/A',
      classDetails: {
        name: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        totalStudents: students.length,
        classTeacher: classObj.classTeacher ? `${classObj.classTeacher.firstName} ${classObj.classTeacher.lastName}` : 'N/A'
      },
      subjectStatistics: Object.values(subjectStats),
      studentResults: studentSummaries,
      summary: {
        classAverage: classAverage.toFixed(2),
        divisions: {
          'Division I': divisionCounts['I'],
          'Division II': divisionCounts['II'],
          'Division III': divisionCounts['III'],
          'Division IV': divisionCounts['IV'],
          'Division 0': divisionCounts['0']
        }
      },
      class: {
        name: classObj.name,
        section: classObj.section || '',
        stream: classObj.stream || '',
        fullName: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim()
      },
      exam: {
        name: exam.name,
        term: 'Term 1'
      },
      students: studentSummaries.map(summary => ({
        id: summary.studentId,
        name: summary.name,
        rollNumber: summary.rollNumber,
        sex: summary.sex || 'M',
        results: summary.subjects.map(subject => ({
          subject: { name: subject.name },
          subjectId: { name: subject.name },
          marksObtained: subject.marks || 0,
          marks: subject.marks || 0,
          grade: subject.grade || 'F',
          points: subject.points || 5
        })),
        totalMarks: summary.totalMarks || 0,
        averageMarks: summary.averageMarks || '0.00',
        totalPoints: summary.totalPoints || 0,
        bestSevenPoints: summary.bestSevenPoints || 0,
        division: summary.division || '0',
        rank: summary.rank || 'N/A'
      }))
    };

    // Create a write stream for the PDF
    const outputPath = path.join(__dirname, 'class_result.pdf');
    const writeStream = fs.createWriteStream(outputPath);

    // Create a mock response object
    const mockRes = {
      setHeader: () => {},
      on: (event, callback) => {
        if (event === 'finish') {
          callback();
        }
      },
      once: () => {},
      emit: () => {}
    };

    // Pipe the PDF to the write stream
    writeStream.on('finish', () => {
      console.log(`Class result PDF generated at: ${outputPath}`);
    });

    // Generate the PDF
    generateClassResultPDF(report, writeStream);
  } catch (error) {
    console.error('Error testing class result PDF:', error);
  }
}

// Run the script
testPdfGenerators();
