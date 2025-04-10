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

// Sample data
const academicYears = [
  {
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
      },
      {
        name: 'Term 2',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-03-30')
      },
      {
        name: 'Term 3',
        startDate: new Date('2024-04-10'),
        endDate: new Date('2024-06-30')
      }
    ]
  }
];

const subjects = [
  { name: 'Mathematics', code: 'MATH', type: 'Core', description: 'Basic mathematics including algebra, geometry, and calculus' },
  { name: 'English', code: 'ENG', type: 'Core', description: 'English language and literature' },
  { name: 'Physics', code: 'PHY', type: 'Core', description: 'Study of matter, energy, and the interaction between them' },
  { name: 'Chemistry', code: 'CHEM', type: 'Core', description: 'Study of substances, their properties, structure, and reactions' },
  { name: 'Biology', code: 'BIO', type: 'Core', description: 'Study of living organisms and their interactions' },
  { name: 'History', code: 'HIST', type: 'Elective', description: 'Study of past events' },
  { name: 'Geography', code: 'GEO', type: 'Elective', description: 'Study of places and the relationships between people and their environments' },
  { name: 'Computer Science', code: 'CS', type: 'Elective', description: 'Study of computers and computational systems' },
  { name: 'Physical Education', code: 'PE', type: 'Elective', description: 'Physical fitness and sports' },
  { name: 'Art', code: 'ART', type: 'Elective', description: 'Visual arts and creative expression' }
];

const users = [
  // Admin user
  {
    username: 'admin',
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
    status: 'active'
  },
  // Teacher users
  {
    username: 'teacher1',
    email: 'teacher1@school.com',
    password: 'teacher123',
    role: 'teacher',
    status: 'active'
  },
  {
    username: 'teacher2',
    email: 'teacher2@school.com',
    password: 'teacher123',
    role: 'teacher',
    status: 'active'
  },
  {
    username: 'teacher3',
    email: 'teacher3@school.com',
    password: 'teacher123',
    role: 'teacher',
    status: 'active'
  },
  // Student users
  {
    username: 'student1',
    email: 'student1@school.com',
    password: 'student123',
    role: 'student',
    status: 'active'
  },
  {
    username: 'student2',
    email: 'student2@school.com',
    password: 'student123',
    role: 'student',
    status: 'active'
  },
  {
    username: 'student3',
    email: 'student3@school.com',
    password: 'student123',
    role: 'student',
    status: 'active'
  },
  {
    username: 'student4',
    email: 'student4@school.com',
    password: 'student123',
    role: 'student',
    status: 'active'
  },
  {
    username: 'student5',
    email: 'student5@school.com',
    password: 'student123',
    role: 'student',
    status: 'active'
  },
  {
    username: 'student6',
    email: 'student6@school.com',
    password: 'student123',
    role: 'student',
    status: 'active'
  }
];

const teachers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'teacher1@school.com',
    gender: 'Male',
    dateOfBirth: new Date('1980-05-15'),
    phoneNumber: '1234567890',
    address: '123 Teacher St',
    employeeId: 'T001',
    qualification: 'PhD in Mathematics',
    joinDate: new Date('2020-01-15'),
    salary: 50000,
    status: 'active'
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'teacher2@school.com',
    gender: 'Female',
    dateOfBirth: new Date('1985-08-20'),
    phoneNumber: '2345678901',
    address: '456 Teacher Ave',
    employeeId: 'T002',
    qualification: 'MSc in Physics',
    joinDate: new Date('2019-06-10'),
    salary: 48000,
    status: 'active'
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'teacher3@school.com',
    gender: 'Male',
    dateOfBirth: new Date('1975-03-25'),
    phoneNumber: '3456789012',
    address: '789 Teacher Blvd',
    employeeId: 'T003',
    qualification: 'BSc in English Literature',
    joinDate: new Date('2021-02-05'),
    salary: 45000,
    status: 'active'
  }
];

const classes = [
  {
    name: 'Form 1',
    section: 'A',
    stream: 'Science',
    capacity: 30
  },
  {
    name: 'Form 2',
    section: 'B',
    stream: 'Arts',
    capacity: 30
  }
];

const students = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'student1@school.com',
    gender: 'Female',
    dateOfBirth: new Date('2005-03-15'),
    phoneNumber: '4567890123',
    address: '123 Student St',
    rollNumber: 'S001',
    admissionDate: new Date('2022-01-10'),
    parentName: 'Michael Johnson',
    parentContact: '7890123456',
    parentEmail: 'michael@example.com'
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'student2@school.com',
    gender: 'Male',
    dateOfBirth: new Date('2006-05-20'),
    phoneNumber: '5678901234',
    address: '456 Student Ave',
    rollNumber: 'S002',
    admissionDate: new Date('2022-01-12'),
    parentName: 'Sarah Smith',
    parentContact: '8901234567',
    parentEmail: 'sarah@example.com'
  },
  {
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'student3@school.com',
    gender: 'Male',
    dateOfBirth: new Date('2005-07-25'),
    phoneNumber: '6789012345',
    address: '789 Student Blvd',
    rollNumber: 'S003',
    admissionDate: new Date('2022-01-15'),
    parentName: 'David Brown',
    parentContact: '9012345678',
    parentEmail: 'david@example.com'
  },
  {
    firstName: 'Diana',
    lastName: 'Miller',
    email: 'student4@school.com',
    gender: 'Female',
    dateOfBirth: new Date('2006-09-30'),
    phoneNumber: '7890123456',
    address: '101 Student Dr',
    rollNumber: 'S004',
    admissionDate: new Date('2022-01-18'),
    parentName: 'James Miller',
    parentContact: '0123456789',
    parentEmail: 'james@example.com'
  },
  {
    firstName: 'Edward',
    lastName: 'Wilson',
    email: 'student5@school.com',
    gender: 'Male',
    dateOfBirth: new Date('2005-11-05'),
    phoneNumber: '8901234567',
    address: '202 Student Ln',
    rollNumber: 'S005',
    admissionDate: new Date('2022-01-20'),
    parentName: 'Linda Wilson',
    parentContact: '1234567890',
    parentEmail: 'linda@example.com'
  },
  {
    firstName: 'Fiona',
    lastName: 'Taylor',
    email: 'student6@school.com',
    gender: 'Female',
    dateOfBirth: new Date('2006-01-10'),
    phoneNumber: '9012345678',
    address: '303 Student Ct',
    rollNumber: 'S006',
    admissionDate: new Date('2022-01-22'),
    parentName: 'Robert Taylor',
    parentContact: '2345678901',
    parentEmail: 'robert@example.com'
  }
];

const exams = [
  {
    name: 'Midterm Exam',
    description: 'Midterm examination for the first term',
    startDate: new Date('2023-10-15'),
    endDate: new Date('2023-10-20'),
    examType: 'Midterm',
    maxMarks: 100,
    passingMarks: 40
  },
  {
    name: 'Final Exam',
    description: 'Final examination for the first term',
    startDate: new Date('2023-12-10'),
    endDate: new Date('2023-12-15'),
    examType: 'Final',
    maxMarks: 100,
    passingMarks: 40
  }
];

// Function to generate random marks between min and max
function getRandomMarks(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to calculate grade based on marks
function calculateGrade(marks) {
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  return 'F';
}

// Function to calculate points based on grade (Tanzania's CSEE system)
function calculatePoints(grade) {
  switch (grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'F': return 5;
    default: return 0;
  }
}

// Function to calculate division based on points (Tanzania's CSEE system)
function calculateDivision(totalPoints) {
  if (totalPoints >= 7 && totalPoints <= 14) return 'I';
  if (totalPoints >= 15 && totalPoints <= 21) return 'II';
  if (totalPoints >= 22 && totalPoints <= 25) return 'III';
  if (totalPoints >= 26 && totalPoints <= 32) return 'IV';
  return '0';
}

async function createDummyData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
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

    // Create academic years
    console.log('Creating academic years...');
    const createdAcademicYears = await AcademicYear.insertMany(academicYears);
    console.log(`Created ${createdAcademicYears.length} academic years`);

    // Create subjects
    console.log('Creating subjects...');
    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`Created ${createdSubjects.length} subjects`);

    // Create users with hashed passwords
    console.log('Creating users...');
    const saltRounds = 10;
    const userPromises = users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      return new User({
        ...user,
        password: hashedPassword
      }).save();
    });
    const createdUsers = await Promise.all(userPromises);
    console.log(`Created ${createdUsers.length} users`);

    // Create teachers and link to users
    console.log('Creating teachers...');
    const teacherUsers = createdUsers.filter(user => user.role === 'teacher');
    const teacherPromises = teachers.map((teacher, index) => {
      return new Teacher({
        ...teacher,
        userId: teacherUsers[index]._id
      }).save();
    });
    const createdTeachers = await Promise.all(teacherPromises);
    console.log(`Created ${createdTeachers.length} teachers`);

    // Create classes and assign teachers and subjects
    console.log('Creating classes...');
    const classPromises = classes.map((cls, index) => {
      // Assign different subjects to each class
      const classSubjects = createdSubjects.slice(0, 7).map((subject, subIndex) => ({
        subject: subject._id,
        teacher: createdTeachers[subIndex % createdTeachers.length]._id
      }));

      return new Class({
        ...cls,
        academicYear: createdAcademicYears[0]._id,
        classTeacher: createdTeachers[index % createdTeachers.length]._id,
        subjects: classSubjects
      }).save();
    });
    const createdClasses = await Promise.all(classPromises);
    console.log(`Created ${createdClasses.length} classes`);

    // Create students and assign to classes
    console.log('Creating students...');
    const studentUsers = createdUsers.filter(user => user.role === 'student');
    const studentPromises = students.map((student, index) => {
      return new Student({
        ...student,
        userId: studentUsers[index]._id,
        class: createdClasses[index % createdClasses.length]._id
      }).save();
    });
    const createdStudents = await Promise.all(studentPromises);
    console.log(`Created ${createdStudents.length} students`);

    // Update classes with students
    console.log('Updating classes with students...');
    for (let i = 0; i < createdClasses.length; i++) {
      const classStudents = createdStudents.filter((student, index) => index % createdClasses.length === i);
      await Class.findByIdAndUpdate(createdClasses[i]._id, {
        $set: { students: classStudents.map(student => student._id) }
      });
    }
    console.log('Classes updated with students');

    // Create exams
    console.log('Creating exams...');
    const examPromises = exams.map(exam => {
      return new Exam({
        ...exam,
        academicYear: createdAcademicYears[0]._id
      }).save();
    });
    const createdExams = await Promise.all(examPromises);
    console.log(`Created ${createdExams.length} exams`);

    // Create results for each student, subject, and exam
    console.log('Creating results...');
    const results = [];

    for (const student of createdStudents) {
      const studentClass = await Class.findById(student.class).populate('subjects.subject');
      
      for (const exam of createdExams) {
        const subjectResults = [];
        let totalMarks = 0;
        let totalPoints = 0;
        
        // Generate results for each subject
        for (const subjectData of studentClass.subjects) {
          const marks = getRandomMarks(30, 95);
          const grade = calculateGrade(marks);
          const points = calculatePoints(grade);
          
          subjectResults.push({
            subject: subjectData.subject._id,
            marks,
            grade,
            points
          });
          
          totalMarks += marks;
          totalPoints += points;
        }
        
        // Sort subject results by points (ascending) to get best 7 subjects
        subjectResults.sort((a, b) => a.points - b.points);
        const bestSevenSubjects = subjectResults.slice(0, 7);
        const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);
        
        // Calculate average marks and division
        const averageMarks = totalMarks / subjectResults.length;
        const division = calculateDivision(bestSevenPoints);
        
        results.push({
          student: student._id,
          class: student.class,
          exam: exam._id,
          academicYear: createdAcademicYears[0]._id,
          subjects: subjectResults,
          totalMarks,
          averageMarks,
          totalPoints,
          bestSevenPoints,
          division
        });
      }
    }

    const createdResults = await Result.insertMany(results);
    console.log(`Created ${createdResults.length} results`);

    console.log('Dummy data creation completed successfully');
  } catch (error) {
    console.error('Error creating dummy data:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createDummyData();
