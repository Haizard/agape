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

async function createSimpleTestData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find or create an academic year
    console.log('Finding or creating academic year...');
    let academicYear = await AcademicYear.findOne({ year: 2023 });

    if (!academicYear) {
      academicYear = new AcademicYear({
        name: '2023-2024',
        year: 2023,
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-06-30'),
        isActive: true,
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-12-15')
          }
        ]
      });
      await academicYear.save();
      console.log('Academic year created:', academicYear._id);
    } else {
      console.log('Academic year already exists:', academicYear._id);
    }

    // Find or create subjects
    console.log('Finding or creating subjects...');
    const subjectData = [
      { name: 'Mathematics', code: 'MATH', type: 'CORE', description: 'Basic mathematics' },
      { name: 'English', code: 'ENG', type: 'CORE', description: 'English language' },
      { name: 'Physics', code: 'PHY', type: 'CORE', description: 'Physics' }
    ];

    const subjects = [];
    for (const data of subjectData) {
      let subject = await Subject.findOne({ code: data.code });
      if (!subject) {
        subject = new Subject(data);
        await subject.save();
        console.log('Subject created:', subject._id);
      } else {
        console.log('Subject already exists:', subject._id);
      }
      subjects.push(subject);
    }
    console.log('Total subjects:', subjects.length);

    // Find or create admin user
    console.log('Finding or creating admin user...');
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      adminUser = new User({
        username: 'admin',
        email: 'admin@school.com',
        password: adminPassword,
        role: 'admin',
        status: 'active'
      });
      await adminUser.save();
      console.log('Admin user created:', adminUser._id);
    } else {
      console.log('Admin user already exists:', adminUser._id);
    }

    // Find or create teacher user
    console.log('Finding or creating teacher user...');
    let teacherUser = await User.findOne({ username: 'teacher1' });
    if (!teacherUser) {
      const teacherPassword = await bcrypt.hash('teacher123', 10);
      teacherUser = new User({
        username: 'teacher1',
        email: 'teacher1@school.com',
        password: teacherPassword,
        role: 'teacher',
        status: 'active'
      });
      await teacherUser.save();
      console.log('Teacher user created:', teacherUser._id);
    } else {
      console.log('Teacher user already exists:', teacherUser._id);
    }

    // Find or create teacher profile
    console.log('Finding or creating teacher profile...');
    let teacher = await Teacher.findOne({ userId: teacherUser._id });
    if (!teacher) {
      teacher = new Teacher({
        firstName: 'John',
        lastName: 'Smith',
        email: 'teacher1@school.com',
        gender: 'Male',
        dateOfBirth: new Date('1980-05-15'),
        contactNumber: '1234567890',
        address: '123 Teacher St',
        employeeId: 'T001',
        qualification: 'PhD in Mathematics',
        experience: '5 years',
        specialization: 'Mathematics',
        joiningDate: new Date('2020-01-15'),
        status: 'active',
        userId: teacherUser._id
      });
      await teacher.save();
      console.log('Teacher profile created:', teacher._id);
    } else {
      console.log('Teacher profile already exists:', teacher._id);
    }

    // Find or create student user
    console.log('Finding or creating student user...');
    let studentUser = await User.findOne({ username: 'student1' });
    if (!studentUser) {
      const studentPassword = await bcrypt.hash('student123', 10);
      studentUser = new User({
        username: 'student1',
        email: 'student1@school.com',
        password: studentPassword,
        role: 'student',
        status: 'active'
      });
      await studentUser.save();
      console.log('Student user created:', studentUser._id);
    } else {
      console.log('Student user already exists:', studentUser._id);
    }

    // Find or create class
    console.log('Finding or creating class...');
    let classObj = await Class.findOne({ name: 'Form 1', section: 'A', academicYear: academicYear._id });
    if (!classObj) {
      classObj = new Class({
        name: 'Form 1',
        section: 'A',
        stream: 'Science',
        academicYear: academicYear._id,
        classTeacher: teacher._id,
        capacity: 30,
        subjects: subjects.map(subject => ({
          subject: subject._id,
          teacher: teacher._id
        }))
      });
      await classObj.save();
      console.log('Class created:', classObj._id);
    } else {
      console.log('Class already exists:', classObj._id);
    }

    // Find or create student profile
    console.log('Finding or creating student profile...');
    let student = await Student.findOne({ userId: studentUser._id });
    if (!student) {
      student = new Student({
        firstName: 'Alice',
        lastName: 'Johnson',
        gender: 'F',
        rollNumber: 'S001',
        userId: studentUser._id,
        class: classObj._id
      });
      await student.save();
      console.log('Student profile created:', student._id);

      // Update class with student
      console.log('Updating class with student...');
      await Class.findByIdAndUpdate(classObj._id, {
        $addToSet: { students: student._id }
      });
      console.log('Class updated with student');
    } else {
      console.log('Student profile already exists:', student._id);
    }

    // Find or create exam
    console.log('Finding or creating exam...');
    let exam = await Exam.findOne({ name: 'Midterm Exam', academicYear: academicYear._id });
    if (!exam) {
      exam = new Exam({
        name: 'Midterm Exam',
        type: 'MID_TERM',
        term: 'Term 1',
        startDate: new Date('2023-10-15'),
        endDate: new Date('2023-10-20'),
        status: 'PUBLISHED',
        academicYear: academicYear._id,
        classes: [{
          class: classObj._id,
          subjects: subjects.map(subject => ({
            subject: subject._id,
            maxMarks: 100
          }))
        }]
      });
      await exam.save();
      console.log('Exam created:', exam._id);
    } else {
      console.log('Exam already exists:', exam._id);
    }

    // Find or create exam type
    console.log('Finding or creating exam type...');
    let examType = await ExamType.findOne({ name: 'Midterm' });
    if (!examType) {
      examType = new ExamType({
        name: 'Midterm',
        description: 'Midterm examination',
        maxMarks: 100,
        isActive: true
      });
      await examType.save();
      console.log('Exam type created:', examType._id);
    } else {
      console.log('Exam type already exists:', examType._id);
    }

    // Create results for each subject
    console.log('Creating results for each subject...');
    for (const subject of subjects) {
      // Check if result already exists
      let result = await Result.findOne({
        studentId: student._id,
        examId: exam._id,
        subjectId: subject._id
      });

      if (!result) {
        // Generate random marks
        const marks = Math.floor(Math.random() * (95 - 30 + 1)) + 30;
        let grade = '';

        if (marks >= 80) grade = 'A';
        else if (marks >= 70) grade = 'B';
        else if (marks >= 60) grade = 'C';
        else if (marks >= 50) grade = 'D';
        else grade = 'F';

        result = new Result({
          studentId: student._id,
          examId: exam._id,
          academicYearId: academicYear._id,
          examTypeId: examType._id,
          subjectId: subject._id,
          marksObtained: marks,
          grade: grade,
          comment: `${grade} grade in ${subject.name}`
        });
        await result.save();
        console.log(`Result created for ${subject.name}:`, result._id);
      } else {
        console.log(`Result already exists for ${subject.name}:`, result._id);
      }
    }

    console.log('Test data creation completed successfully');

    // Print IDs for reference
    console.log('\nReference IDs for testing:');
    console.log('Academic Year ID:', academicYear._id);
    console.log('Class ID:', classObj._id);
    console.log('Student ID:', student._id);
    console.log('Exam ID:', exam._id);
    console.log('Exam Type ID:', examType._id);
    console.log('\nUse these IDs to test the result report generation');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createSimpleTestData();
