const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const AcademicYear = require('../models/AcademicYear');
const Teacher = require('../models/Teacher');
const ExamType = require('../models/ExamType');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

// Function to generate a result report for a specific student and exam
async function generateStudentResultReport(studentId, examId) {
  try {
    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      console.error(`Student not found with ID: ${studentId}`);
      return null;
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.error(`Exam not found with ID: ${examId}`);
      return null;
    }

    // Find the class
    const classData = await Class.findById(student.class);
    if (!classData) {
      console.error(`Class not found with ID: ${student.class}`);
      return null;
    }

    // Find the academic year
    const academicYear = await AcademicYear.findById(exam.academicYear);
    if (!academicYear) {
      console.error(`Academic year not found with ID: ${exam.academicYear}`);
      return null;
    }

    // Find all results for this student and exam
    const results = await Result.find({
      studentId: studentId,
      examId: examId
    }).populate('subjectId');

    if (results.length === 0) {
      console.error(`No results found for student ${studentId} and exam ${examId}`);
      return null;
    }

    // Calculate totals
    let totalMarks = 0;
    let totalPoints = 0;

    // Format subject results
    const subjectResults = [];
    for (const result of results) {
      if (!result.subjectId) continue;

      // Calculate points based on grade
      let points = 0;
      switch (result.grade) {
        case 'A': points = 1; break;
        case 'B': points = 2; break;
        case 'C': points = 3; break;
        case 'D': points = 4; break;
        case 'F': points = 5; break;
      }

      subjectResults.push({
        subject: result.subjectId.name,
        marks: result.marksObtained,
        grade: result.grade,
        points: points,
        remarks: getRemarks(result.grade)
      });

      totalMarks += result.marksObtained;
      totalPoints += points;
    }

    // Calculate average marks
    const averageMarks = totalMarks / subjectResults.length;

    // Calculate best seven points (or all if less than 7 subjects)
    const sortedPoints = subjectResults.map(r => r.points).sort((a, b) => a - b);
    const bestSevenPoints = sortedPoints.slice(0, Math.min(7, sortedPoints.length)).reduce((sum, p) => sum + p, 0);

    // Calculate division
    let division;
    if (bestSevenPoints >= 7 && bestSevenPoints <= 14) division = 'I';
    else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) division = 'II';
    else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) division = 'III';
    else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) division = 'IV';
    else division = '0';

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'St. John Vianney Secondary School',
      academicYear: academicYear.name,
      examName: exam.name,
      examDate: `${exam.startDate.toLocaleDateString()} - ${exam.endDate.toLocaleDateString()}`,
      studentDetails: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: `${classData.name} ${classData.section || ''} ${classData.stream || ''}`.trim(),
        gender: student.gender
      },
      subjectResults: subjectResults,
      summary: {
        totalMarks: totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints: totalPoints,
        bestSevenPoints: bestSevenPoints,
        division: division,
        rank: 'N/A' // Would require comparing with other students
      }
    };

    return report;
  } catch (error) {
    console.error('Error generating student result report:', error);
    return null;
  }
}

// Function to generate a class result report for a specific exam
async function generateClassResultReport(classId, examId) {
  try {
    // Find the class
    const classData = await Class.findById(classId)
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
      console.error(`Class not found with ID: ${classId}`);
      return null;
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.error(`Exam not found with ID: ${examId}`);
      return null;
    }

    // Get all students in the class
    const students = await Student.find({ class: classId });
    if (students.length === 0) {
      console.error(`No students found for class ${classId}`);
      return null;
    }

    // Calculate class statistics
    const subjectStats = {};
    for (const subjectData of classData.subjects) {
      if (subjectData.subject && subjectData.teacher) {
        subjectStats[subjectData.subject._id.toString()] = {
          name: subjectData.subject.name,
          teacher: `${subjectData.teacher.firstName} ${subjectData.teacher.lastName}`,
          totalMarks: 0,
          averageMarks: 0,
          grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          highestMarks: 0,
          lowestMarks: 100
        };
      }
    }

    // Process results for each student
    const studentResultsList = [];
    for (const student of students) {
      // Get all results for this student and exam
      const studentResults = await Result.find({
        studentId: student._id,
        examId: examId
      }).populate('subjectId');

      if (studentResults.length === 0) continue;

      // Calculate student total and average
      let studentTotal = 0;
      let subjectCount = 0;
      let totalPoints = 0;

      // Process each subject result
      for (const result of studentResults) {
        if (!result.subjectId) continue;

        const subjectId = result.subjectId._id.toString();
        if (subjectStats[subjectId]) {
          // Calculate points based on grade
          let points = 0;
          switch (result.grade) {
            case 'A': points = 1; break;
            case 'B': points = 2; break;
            case 'C': points = 3; break;
            case 'D': points = 4; break;
            case 'F': points = 5; break;
          }

          // Update subject statistics
          subjectStats[subjectId].totalMarks += result.marksObtained;
          subjectStats[subjectId].grades[result.grade]++;
          subjectStats[subjectId].highestMarks = Math.max(subjectStats[subjectId].highestMarks, result.marksObtained);
          subjectStats[subjectId].lowestMarks = Math.min(subjectStats[subjectId].lowestMarks, result.marksObtained);

          // Update student totals
          studentTotal += result.marksObtained;
          totalPoints += points;
          subjectCount++;
        }
      }

      if (subjectCount === 0) continue;

      // Calculate average marks
      const averageMarks = studentTotal / subjectCount;

      // Calculate best seven points (or all if less than 7 subjects)
      const sortedPoints = studentResults.map(r => {
        let points = 0;
        switch (r.grade) {
          case 'A': points = 1; break;
          case 'B': points = 2; break;
          case 'C': points = 3; break;
          case 'D': points = 4; break;
          case 'F': points = 5; break;
        }
        return points;
      }).sort((a, b) => a - b);

      const bestSevenPoints = sortedPoints.slice(0, Math.min(7, sortedPoints.length)).reduce((sum, p) => sum + p, 0);

      // Calculate division
      let division;
      if (bestSevenPoints >= 7 && bestSevenPoints <= 14) division = 'I';
      else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) division = 'II';
      else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) division = 'III';
      else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) division = 'IV';
      else division = '0';

      // Add student result summary
      studentResultsList.push({
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        totalMarks: studentTotal,
        averageMarks: averageMarks.toFixed(2),
        division: division,
        rank: 'N/A' // Will be calculated later
      });
    }

    if (studentResultsList.length === 0) {
      console.error(`No results found for class ${classId} and exam ${examId}`);
      return null;
    }

    // Calculate averages for each subject
    for (const subjectId of Object.keys(subjectStats)) {
      const studentCount = students.length;
      if (studentCount > 0) {
        subjectStats[subjectId].averageMarks = (subjectStats[subjectId].totalMarks / studentCount).toFixed(2);
      }
    }

    // Sort students by average marks for ranking
    studentResultsList.sort((a, b) => Number(b.averageMarks) - Number(a.averageMarks));

    // Assign ranks
    for (let i = 0; i < studentResultsList.length; i++) {
      studentResultsList[i].rank = i + 1;
    }

    // Format the report
    const report = {
      reportTitle: `${exam.name} Class Result Report`,
      schoolName: 'St. John Vianney Secondary School',
      academicYear: classData.academicYear ? classData.academicYear.name : 'N/A',
      examName: exam.name,
      examDate: `${exam.startDate.toLocaleDateString()} - ${exam.endDate.toLocaleDateString()}`,
      classDetails: {
        name: `${classData.name} ${classData.section || ''} ${classData.stream || ''}`.trim(),
        totalStudents: students.length,
        classTeacher: classData.classTeacher ?
          `${classData.classTeacher.firstName} ${classData.classTeacher.lastName}` : 'N/A'
      },
      subjectStatistics: Object.values(subjectStats),
      studentResults: studentResultsList,
      summary: {
        classAverage: studentResultsList.length > 0 ?
          (studentResultsList.reduce((sum, student) => sum + Number(student.averageMarks), 0) / studentResultsList.length).toFixed(2) :
          '0.00',
        divisions: {
          I: studentResultsList.filter(student => student.division === 'I').length,
          II: studentResultsList.filter(student => student.division === 'II').length,
          III: studentResultsList.filter(student => student.division === 'III').length,
          IV: studentResultsList.filter(student => student.division === 'IV').length,
          0: studentResultsList.filter(student => student.division === '0').length
        }
      }
    };

    return report;
  } catch (error) {
    console.error('Error generating class result report:', error);
    return null;
  }
}

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

// Main function to test result reports
async function testResultReports() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get a sample student, class, and exam
    const student = await Student.findOne();
    const classData = await Class.findOne();
    const exam = await Exam.findOne();

    if (!student || !classData || !exam) {
      console.error('Could not find sample data. Please run createDummyData.js first.');
      return;
    }

    console.log('Generating student result report...');
    const studentReport = await generateStudentResultReport(student._id, exam._id);

    if (studentReport) {
      console.log('Student Result Report:');
      console.log(JSON.stringify(studentReport, null, 2));

      // Save to file
      const studentReportPath = path.join(__dirname, 'student_report.json');
      fs.writeFileSync(studentReportPath, JSON.stringify(studentReport, null, 2));
      console.log(`Student report saved to ${studentReportPath}`);
    }

    console.log('\nGenerating class result report...');
    const classReport = await generateClassResultReport(classData._id, exam._id);

    if (classReport) {
      console.log('Class Result Report:');
      console.log(JSON.stringify(classReport, null, 2));

      // Save to file
      const classReportPath = path.join(__dirname, 'class_report.json');
      fs.writeFileSync(classReportPath, JSON.stringify(classReport, null, 2));
      console.log(`Class report saved to ${classReportPath}`);
    }

    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error testing result reports:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testResultReports();
