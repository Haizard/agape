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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

// Tanzania Secondary School Subjects
const subjects = [
  { name: 'Kiswahili', code: 'KIS', category: 'Language' },
  { name: 'English', code: 'ENG', category: 'Language' },
  { name: 'Mathematics', code: 'MATH', category: 'Science' },
  { name: 'Biology', code: 'BIO', category: 'Science' },
  { name: 'Physics', code: 'PHY', category: 'Science' },
  { name: 'Chemistry', code: 'CHEM', category: 'Science' },
  { name: 'History', code: 'HIST', category: 'Arts' },
  { name: 'Geography', code: 'GEO', category: 'Arts' },
  { name: 'Civics', code: 'CIV', category: 'Arts' },
  { name: 'Basic Mathematics', code: 'B-MATH', category: 'Science' },
  { name: 'Book Keeping', code: 'BK', category: 'Business' },
  { name: 'Commerce', code: 'COMM', category: 'Business' },
  { name: 'Computer Studies', code: 'COMP', category: 'Science' }
];

// Teacher data with their teaching subjects (by subject code)
const teachers = [
  {
    firstName: 'John',
    lastName: 'Makundi',
    email: 'john.makundi@school.com',
    gender: 'Male',
    subjects: ['MATH', 'B-MATH'],
    qualification: 'BSc Mathematics'
  },
  {
    firstName: 'Mary',
    lastName: 'Shirima',
    email: 'mary.shirima@school.com',
    gender: 'Female',
    subjects: ['ENG'],
    qualification: 'BA English'
  },
  {
    firstName: 'James',
    lastName: 'Mushi',
    email: 'james.mushi@school.com',
    gender: 'Male',
    subjects: ['PHY', 'MATH'],
    qualification: 'BSc Physics'
  },
  {
    firstName: 'Grace',
    lastName: 'Mwakasege',
    email: 'grace.mwakasege@school.com',
    gender: 'Female',
    subjects: ['BIO'],
    qualification: 'BSc Biology'
  },
  {
    firstName: 'Peter',
    lastName: 'Kimaro',
    email: 'peter.kimaro@school.com',
    gender: 'Male',
    subjects: ['CHEM'],
    qualification: 'BSc Chemistry'
  },
  {
    firstName: 'Sarah',
    lastName: 'Mwakyusa',
    email: 'sarah.mwakyusa@school.com',
    gender: 'Female',
    subjects: ['KIS'],
    qualification: 'BA Kiswahili'
  },
  {
    firstName: 'David',
    lastName: 'Msangi',
    email: 'david.msangi@school.com',
    gender: 'Male',
    subjects: ['HIST', 'CIV'],
    qualification: 'BA History'
  },
  {
    firstName: 'Elizabeth',
    lastName: 'Mwakagile',
    email: 'elizabeth.mwakagile@school.com',
    gender: 'Female',
    subjects: ['GEO'],
    qualification: 'BSc Geography'
  },
  {
    firstName: 'Michael',
    lastName: 'Mwasanga',
    email: 'michael.mwasanga@school.com',
    gender: 'Male',
    subjects: ['COMP'],
    qualification: 'BSc Computer Science'
  },
  {
    firstName: 'Agnes',
    lastName: 'Kivuyo',
    email: 'agnes.kivuyo@school.com',
    gender: 'Female',
    subjects: ['BK', 'COMM'],
    qualification: 'BBA'
  },
  {
    firstName: 'Richard',
    lastName: 'Macha',
    email: 'richard.macha@school.com',
    gender: 'Male',
    subjects: ['MATH', 'PHY'],
    qualification: 'BSc Mathematics'
  },
  {
    firstName: 'Joyce',
    lastName: 'Mfinanga',
    email: 'joyce.mfinanga@school.com',
    gender: 'Female',
    subjects: ['ENG', 'KIS'],
    qualification: 'BA Languages'
  },
  {
    firstName: 'Thomas',
    lastName: 'Mrema',
    email: 'thomas.mrema@school.com',
    gender: 'Male',
    subjects: ['BIO', 'CHEM'],
    qualification: 'BSc Biology'
  },
  {
    firstName: 'Lucy',
    lastName: 'Mwaikambo',
    email: 'lucy.mwaikambo@school.com',
    gender: 'Female',
    subjects: ['HIST', 'GEO'],
    qualification: 'BA Geography'
  }
];

// Classes configuration
const classes = [
  { name: 'Form 1', stream: 'A', capacity: 50 },
  { name: 'Form 2', stream: 'A', capacity: 50 },
  { name: 'Form 3', stream: 'A', capacity: 50 },
  { name: 'Form 4', stream: 'A', capacity: 50 }
];

// Function to generate random marks
function generateRandomMarks() {
  return Math.floor(Math.random() * (100 - 30 + 1)) + 30;
}

// Function to calculate grade
function calculateGrade(marks) {
  if (marks >= 75) return 'A';
  if (marks >= 65) return 'B';
  if (marks >= 45) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
}

// Function to generate random Tanzanian names
function generateTanzanianName() {
  const firstNames = ['Juma', 'Amina', 'Hassan', 'Fatima', 'Said', 'Zainab', 'Ibrahim', 'Maryam', 
    'Rashid', 'Aisha', 'Omar', 'Khadija', 'Salim', 'Rehema', 'Abdul', 'Jamila'];
  const lastNames = ['Mushi', 'Kimaro', 'Shirima', 'Massawe', 'Mrema', 'Mfinanga', 'Msangi', 
    'Mwakasege', 'Mwakyusa', 'Kivuyo', 'Macha', 'Mwaikambo'];
  
  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}

async function createSecondarySchoolData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      AcademicYear.deleteMany({}),
      Exam.deleteMany({}),
      Result.deleteMany({})
    ]);
    console.log('Existing data cleared');

    // Create academic year
    const academicYear = await AcademicYear.create({
      name: '2023-2024',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-08-31'),
      isActive: true
    });

    // Create subjects
    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`Created ${createdSubjects.length} subjects`);

    // Create teachers with user accounts
    const createdTeachers = [];
    for (const teacher of teachers) {
      // Create user account
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: teacher.email.split('@')[0],
        email: teacher.email,
        password: hashedPassword,
        role: 'teacher'
      });

      // Create teacher profile
      const teacherSubjects = teacher.subjects.map(code => 
        createdSubjects.find(s => s.code === code)._id
      );

      const teacherDoc = await Teacher.create({
        ...teacher,
        userId: user._id,
        subjects: teacherSubjects
      });

      createdTeachers.push(teacherDoc);
    }
    console.log(`Created ${createdTeachers.length} teachers`);

    // Create classes and assign teachers
    const createdClasses = [];
    for (const cls of classes) {
      const classSubjects = [];
      
      // Assign teachers to subjects for this class
      for (const subject of createdSubjects) {
        const qualifiedTeachers = createdTeachers.filter(t => 
          t.subjects.some(s => s.toString() === subject._id.toString())
        );
        
        if (qualifiedTeachers.length > 0) {
          const teacher = qualifiedTeachers[Math.floor(Math.random() * qualifiedTeachers.length)];
          classSubjects.push({
            subject: subject._id,
            teacher: teacher._id
          });
        }
      }

      const classDoc = await Class.create({
        ...cls,
        academicYear: academicYear._id,
        subjects: classSubjects
      });
      createdClasses.push(classDoc);
    }
    console.log(`Created ${createdClasses.length} classes`);

    // Create students and assign to classes
    for (const cls of createdClasses) {
      for (let i = 0; i < cls.capacity; i++) {
        const name = generateTanzanianName();
        const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i}@student.school.com`;
        
        // Create user account
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
          username: email.split('@')[0],
          email,
          password: hashedPassword,
          role: 'student'
        });

        // Create student profile
        await Student.create({
          ...name,
          email,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          dateOfBirth: new Date(2000 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          class: cls._id,
          userId: user._id,
          rollNumber: `${cls.name.replace(' ', '')}-${(i + 1).toString().padStart(3, '0')}`
        });
      }
    }
    console.log('Created students for all classes');

    // Create exam
    const exam = await Exam.create({
      name: 'Midterm Examination',
      examType: 'Midterm',
      startDate: new Date('2023-10-15'),
      endDate: new Date('2023-10-25'),
      academicYear: academicYear._id
    });

    // Generate results for all students
    const students = await Student.find();
    for (const student of students) {
      const studentClass = await Class.findById(student.class).populate('subjects.subject subjects.teacher');
      
      for (const classSubject of studentClass.subjects) {
        const marks = generateRandomMarks();
        const grade = calculateGrade(marks);
        
        await Result.create({
          student: student._id,
          exam: exam._id,
          subject: classSubject.subject._id,
          teacher: classSubject.teacher._id,
          class: studentClass._id,
          academicYear: academicYear._id,
          marks,
          grade,
          remarks: `${grade} - ${marks >= 45 ? 'Pass' : 'Fail'}`
        });
      }
    }
    console.log('Generated results for all students');

    console.log('Successfully created all dummy data');
  } catch (error) {
    console.error('Error creating dummy data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createSecondarySchoolData();