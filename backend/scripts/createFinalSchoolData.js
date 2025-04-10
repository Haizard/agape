const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ExamType = require('../models/ExamType');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

// Function to generate random marks
function generateRandomMarks() {
  return Math.floor(Math.random() * (100 - 30 + 1)) + 30;
}

// Function to calculate grade based on marks
function calculateGrade(marks) {
  if (marks >= 75) return 'A';
  if (marks >= 65) return 'B';
  if (marks >= 45) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
}

async function createFinalSchoolData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find academic year
    console.log('Finding academic year...');
    const academicYear = await AcademicYear.findOne({ year: 2023 });
    if (!academicYear) {
      throw new Error('Academic year not found. Please run the minimal script first.');
    }
    console.log(`Found academic year: ${academicYear.name}`);

    // Find exam type
    console.log('Finding exam type...');
    const examType = await ExamType.findOne({ name: 'Midterm' });
    if (!examType) {
      throw new Error('Exam type not found. Please run the minimal script first.');
    }
    console.log(`Found exam type: ${examType.name}`);

    // Find subjects
    console.log('Finding subjects...');
    const subjects = await Subject.find();
    if (subjects.length === 0) {
      throw new Error('No subjects found. Please run the minimal script first.');
    }
    console.log(`Found ${subjects.length} subjects`);

    // Find classes
    console.log('Finding classes...');
    const classes = await Class.find({ academicYear: academicYear._id });
    if (classes.length === 0) {
      throw new Error('No classes found. Please run the minimal script first.');
    }
    console.log(`Found ${classes.length} classes`);

    // Find exam
    console.log('Finding exam...');
    const exam = await Exam.findOne({ 
      name: 'Midterm Examination Term 1',
      academicYear: academicYear._id
    });
    if (!exam) {
      throw new Error('Exam not found. Please run the minimal script first.');
    }
    console.log(`Found exam: ${exam.name}`);

    // Find existing students
    console.log('Finding existing students...');
    const existingStudents = await Student.find();
    console.log(`Found ${existingStudents.length} existing students`);

    // Find existing teachers
    console.log('Finding existing teachers...');
    const existingTeachers = await Teacher.find();
    console.log(`Found ${existingTeachers.length} existing teachers`);

    // Generate more results for existing students
    console.log('Generating more results for existing students...');
    let resultCount = 0;
    
    for (const student of existingStudents) {
      for (const subject of subjects) {
        // Check if result already exists
        const existingResult = await Result.findOne({
          studentId: student._id,
          examId: exam._id,
          subjectId: subject._id
        });
        
        if (!existingResult) {
          const marks = generateRandomMarks();
          const grade = calculateGrade(marks);
          
          const result = await Result.create({
            studentId: student._id,
            examId: exam._id,
            academicYearId: academicYear._id,
            examTypeId: examType._id,
            subjectId: subject._id,
            marksObtained: marks,
            grade,
            comment: `${grade} - ${marks >= 45 ? 'Pass' : 'Fail'}`
          });
          
          resultCount++;
          if (resultCount % 10 === 0) {
            console.log(`Created ${resultCount} results so far...`);
          }
        }
      }
    }
    
    console.log(`Created a total of ${resultCount} new results`);
    console.log('\nSuccessfully generated additional results for existing students');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createFinalSchoolData();
