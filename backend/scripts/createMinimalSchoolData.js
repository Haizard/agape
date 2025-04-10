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

async function createMinimalSchoolData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find or create academic year
    console.log('Finding or creating academic year...');
    let academicYear = await AcademicYear.findOne({ year: 2023 });

    if (!academicYear) {
      academicYear = await AcademicYear.create({
        name: '2023-2024',
        year: 2023,
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-08-31'),
        isActive: true,
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-12-15')
          }
        ]
      });
      console.log(`Created academic year: ${academicYear.name}`);
    } else {
      console.log(`Found existing academic year: ${academicYear.name}`);
    }

    // Find or create exam type
    console.log('Finding or creating exam type...');
    let examType = await ExamType.findOne({ name: 'Midterm' });

    if (!examType) {
      examType = await ExamType.create({
        name: 'Midterm',
        description: 'Midterm assessment',
        maxMarks: 100,
        isActive: true
      });
      console.log(`Created exam type: ${examType.name}`);
    } else {
      console.log(`Found existing exam type: ${examType.name}`);
    }

    // Find or create subjects
    console.log('Finding or creating subjects...');
    const subjectData = [
      { name: 'Mathematics', code: 'MATH', category: 'Science', type: 'CORE' },
      { name: 'English', code: 'ENG', category: 'Language', type: 'CORE' },
      { name: 'Physics', code: 'PHY', category: 'Science', type: 'CORE' }
    ];

    const subjects = [];
    for (const data of subjectData) {
      let subject = await Subject.findOne({ code: data.code });
      if (!subject) {
        subject = await Subject.create(data);
        console.log(`Created subject: ${subject.name}`);
      } else {
        console.log(`Found existing subject: ${subject.name}`);
      }
      subjects.push(subject);
    }

    // Find or create teacher user
    console.log('Finding or creating teacher user...');
    let teacherUser = await User.findOne({ username: 'teacher1' });

    if (!teacherUser) {
      const teacherPassword = await bcrypt.hash('teacher123', 10);
      teacherUser = await User.create({
        username: 'teacher1',
        email: 'teacher1@school.com',
        password: teacherPassword,
        role: 'teacher'
      });
      console.log(`Created teacher user: ${teacherUser.username}`);
    } else {
      console.log(`Found existing teacher user: ${teacherUser.username}`);
    }

    // Find or create teacher profile
    console.log('Finding or creating teacher profile...');
    let teacher = await Teacher.findOne({ userId: teacherUser._id });

    if (!teacher) {
      teacher = await Teacher.create({
        firstName: 'John',
        lastName: 'Smith',
        email: 'teacher1@school.com',
        gender: 'Male',
        qualification: 'BSc Mathematics',
        experience: '5 years',
        employeeId: 'TCH001',
        subjects: [subjects[0]._id, subjects[2]._id],
        userId: teacherUser._id,
        status: 'active'
      });
      console.log(`Created teacher profile: ${teacher.firstName} ${teacher.lastName}`);
    } else {
      console.log(`Found existing teacher profile: ${teacher.firstName} ${teacher.lastName}`);
    }

    // Find or create class
    console.log('Finding or creating class...');
    let classObj = await Class.findOne({ name: 'Form 1', academicYear: academicYear._id });

    if (!classObj) {
      classObj = await Class.create({
        name: 'Form 1',
        stream: 'A',
        section: 'Science',
        capacity: 50,
        academicYear: academicYear._id,
        classTeacher: teacher._id,
        subjects: [
          { subject: subjects[0]._id, teacher: teacher._id },
          { subject: subjects[1]._id, teacher: teacher._id },
          { subject: subjects[2]._id, teacher: teacher._id }
        ],
        students: []
      });
      console.log(`Created class: ${classObj.name}`);
    } else {
      console.log(`Found existing class: ${classObj.name}`);
    }

    // Find or create student user
    console.log('Finding or creating student user...');
    let studentUser = await User.findOne({ username: 'student1' });

    if (!studentUser) {
      const studentPassword = await bcrypt.hash('student123', 10);
      studentUser = await User.create({
        username: 'student1',
        email: 'student1@school.com',
        password: studentPassword,
        role: 'student'
      });
      console.log(`Created student user: ${studentUser.username}`);
    } else {
      console.log(`Found existing student user: ${studentUser.username}`);
    }

    // Find or create student profile
    console.log('Finding or creating student profile...');
    let student = await Student.findOne({ userId: studentUser._id });

    if (!student) {
      student = await Student.create({
        firstName: 'Alice',
        lastName: 'Johnson',
        gender: 'F',
        class: classObj._id,
        userId: studentUser._id,
        rollNumber: 'Form1-001'
      });
      console.log(`Created student profile: ${student.firstName} ${student.lastName}`);
    } else {
      console.log(`Found existing student profile: ${student.firstName} ${student.lastName}`);
    }

    // Update class with student if not already added
    console.log('Checking if student is in class...');
    const studentInClass = classObj.students.some(s => s.toString() === student._id.toString());

    if (!studentInClass) {
      console.log('Updating class with student...');
      await Class.findByIdAndUpdate(classObj._id, {
        $addToSet: { students: student._id }
      });
      console.log('Class updated with student');
    } else {
      console.log('Student already in class');
    }

    // Find or create exam
    console.log('Finding or creating exam...');
    let exam = await Exam.findOne({ name: 'Midterm Examination Term 1', academicYear: academicYear._id });

    if (!exam) {
      exam = await Exam.create({
        name: 'Midterm Examination Term 1',
        type: 'MID_TERM',
        term: 'Term 1',
        startDate: new Date('2023-10-15'),
        endDate: new Date('2023-10-25'),
        academicYear: academicYear._id,
        status: 'COMPLETED',
        classes: [{
          class: classObj._id,
          subjects: subjects.map(subject => ({
            subject: subject._id,
            maxMarks: 100
          }))
        }]
      });
      console.log(`Created exam: ${exam.name}`);
    } else {
      console.log(`Found existing exam: ${exam.name}`);
    }

    // Generate results if they don't exist
    console.log('Checking and generating results...');
    for (const subject of subjects) {
      // Check if result already exists
      const existingResult = await Result.findOne({
        studentId: student._id,
        examId: exam._id,
        subjectId: subject._id
      });

      if (!existingResult) {
        const marks = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
        let grade = '';

        if (marks >= 75) grade = 'A';
        else if (marks >= 65) grade = 'B';
        else if (marks >= 45) grade = 'C';
        else if (marks >= 30) grade = 'D';
        else grade = 'F';

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
        console.log(`Created result for ${subject.name}: ${marks} marks, grade ${grade}`);
      } else {
        console.log(`Found existing result for ${subject.name}: ${existingResult.marksObtained} marks, grade ${existingResult.grade}`);
      }
    }

    console.log('\nSuccessfully created minimal school data');
    console.log('\nReference IDs for testing:');
    console.log('Academic Year ID:', academicYear._id);
    console.log('Class ID:', classObj._id);
    console.log('Student ID:', student._id);
    console.log('Exam ID:', exam._id);
    console.log('Exam Type ID:', examType._id);
    console.log('Teacher ID:', teacher._id);

  } catch (error) {
    console.error('Error creating minimal school data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createMinimalSchoolData();
