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

async function createDummyResults() {
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

    // Get the exam type
    const examTypeId = '67ee9fc5fc46e8d35a4b6671'; // Midterm
    const examType = await ExamType.findById(examTypeId);
    if (!examType) {
      console.log(`Exam type not found with ID: ${examTypeId}`);
      return;
    }
    console.log(`Found exam type: ${examType.name}`);

    // Get the academic year
    const academicYearId = '67ee9fc4fc46e8d35a4b666b'; // 2023-2024
    const academicYear = await AcademicYear.findById(academicYearId);
    if (!academicYear) {
      console.log(`Academic year not found with ID: ${academicYearId}`);
      return;
    }
    console.log(`Found academic year: ${academicYear.name}`);

    // Get all subjects
    const subjects = await Subject.find();
    if (subjects.length === 0) {
      console.log('No subjects found');
      return;
    }
    console.log(`Found ${subjects.length} subjects`);

    // Delete existing results for this student and exam
    await Result.deleteMany({ 
      $or: [
        { studentId: studentId, examId: examId },
        { student: studentId, exam: examId }
      ]
    });
    console.log('Deleted existing results for this student and exam');

    // Create dummy results for each subject
    const results = [];
    for (const subject of subjects) {
      // Generate a random mark between 40 and 95
      const mark = Math.floor(Math.random() * 56) + 40;
      
      // Calculate grade and points based on mark
      let grade, points;
      if (mark >= 80) {
        grade = 'A';
        points = 1;
      } else if (mark >= 65) {
        grade = 'B';
        points = 2;
      } else if (mark >= 50) {
        grade = 'C';
        points = 3;
      } else if (mark >= 40) {
        grade = 'D';
        points = 4;
      } else {
        grade = 'F';
        points = 5;
      }
      
      // Create the result
      const result = new Result({
        studentId: studentId,
        examId: examId,
        academicYearId: academicYearId,
        examTypeId: examTypeId,
        subjectId: subject._id,
        classId: classId,
        marksObtained: mark,
        grade: grade,
        points: points,
        comment: `${grade} - ${getRemarks(grade)}`
      });
      
      // Save the result
      await result.save();
      results.push(result);
      console.log(`Created result for subject ${subject.name}: Mark=${mark}, Grade=${grade}`);
    }

    console.log(`Created ${results.length} results for student ${student.firstName} ${student.lastName}`);
  } catch (error) {
    console.error('Error creating dummy results:', error);
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
createDummyResults();
