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

async function testClassReport() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

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

    // Calculate averages for subjects
    Object.keys(subjectStats).forEach(subjectId => {
      const stats = subjectStats[subjectId];
      if (stats.studentCount > 0) {
        stats.averageMarks = (stats.totalMarks / stats.studentCount).toFixed(2);
      }
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
        division
      };
    });

    // Sort students by average marks for ranking
    studentResults.sort((a, b) => parseFloat(b.averageMarks) - parseFloat(a.averageMarks));

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
        name: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        totalStudents: classObj.students ? classObj.students.length : 0,
        classTeacher: classObj.classTeacher ?
          `${classObj.classTeacher.firstName} ${classObj.classTeacher.lastName}` : 'N/A'
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
        name: classObj.name,
        section: classObj.section || '',
        stream: classObj.stream || '',
        fullName: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim()
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
        results: Object.values(studentResultsMap[student.studentId].subjects).map(subject => ({
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

    console.log('Class Result Report:');
    console.log(JSON.stringify(report, null, 2));

    // Print the marks for each student and subject to verify they are not undefined
    console.log('\nStudent Subject Marks:');
    for (const student of report.students) {
      console.log(`\nStudent: ${student.name}`);
      for (const result of student.results) {
        console.log(`${result.subject.name}: ${result.marks}`);
      }
      console.log(`Total Marks: ${student.totalMarks}`);
      console.log(`Average Marks: ${student.averageMarks}`);
    }
  } catch (error) {
    console.error('Error testing class report:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
testClassReport();
