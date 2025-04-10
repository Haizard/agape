const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const ExamType = require('../models/ExamType');
const AcademicYear = require('../models/AcademicYear');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function testUpdatedStudentReport() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

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
    let totalSubjects = 0;
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

    // Calculate averages
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
        rank: 'N/A', // Would require comparing with other students
        gradeDistribution
      },
      // Add these fields for compatibility with the PDF generator
      student: {
        fullName: `${student.firstName} ${student.lastName}`
      },
      class: {
        fullName: `Form 1`
      },
      exam: {
        name: exam.name,
        term: 'Term 1'
      },
      results: subjectResults,
      totalMarks: totalMarks,
      points: totalPoints,
      grade: division.replace('Division ', '')
    };

    console.log('Student Result Report:');
    console.log(JSON.stringify(report, null, 2));

    // Print the marks for each subject to verify they are not undefined
    console.log('\nSubject Marks:');
    for (const subject of subjectResults) {
      console.log(`${subject.subject}: ${subject.marks}`);
    }

    // Print the total marks to verify it's not NaN
    console.log(`\nTotal Marks: ${totalMarks}`);
    console.log(`Average Marks: ${averageMarks.toFixed(2)}`);
  } catch (error) {
    console.error('Error testing student report:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Helper function to get remarks based on grade
function getRemarks(grade) {
  switch (grade) {
    case 'A':
      return 'Excellent';
    case 'B':
      return 'Very Good';
    case 'C':
      return 'Good';
    case 'D':
      return 'Satisfactory';
    case 'F':
      return 'Fail';
    default:
      return 'N/A';
  }
}

// Run the script
testUpdatedStudentReport();
