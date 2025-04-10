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

// Tanzania Secondary School Subjects
const subjects = [
  { name: 'Kiswahili', code: 'KIS', category: 'Language', type: 'CORE' },
  { name: 'English', code: 'ENG', category: 'Language', type: 'CORE' },
  { name: 'Mathematics', code: 'MATH', category: 'Science', type: 'CORE' },
  { name: 'Biology', code: 'BIO', category: 'Science', type: 'CORE' },
  { name: 'Physics', code: 'PHY', category: 'Science', type: 'CORE' },
  { name: 'Chemistry', code: 'CHEM', category: 'Science', type: 'CORE' },
  { name: 'History', code: 'HIST', category: 'Arts', type: 'CORE' },
  { name: 'Geography', code: 'GEO', category: 'Arts', type: 'CORE' },
  { name: 'Civics', code: 'CIV', category: 'Arts', type: 'CORE' },
  { name: 'Basic Mathematics', code: 'B-MATH', category: 'Science', type: 'CORE' },
  { name: 'Book Keeping', code: 'BK', category: 'Business', type: 'OPTIONAL' },
  { name: 'Commerce', code: 'COMM', category: 'Business', type: 'OPTIONAL' },
  { name: 'Computer Studies', code: 'COMP', category: 'Science', type: 'OPTIONAL' }
];

// Teacher data with their teaching subjects (by subject code)
const teachers = [
  {
    firstName: 'John',
    lastName: 'Makundi',
    email: 'john.makundi@school.com',
    gender: 'Male',
    subjects: ['MATH', 'B-MATH'],
    qualification: 'BSc Mathematics',
    experience: '5 years',
    employeeId: 'TCH001'
  },
  {
    firstName: 'Mary',
    lastName: 'Shirima',
    email: 'mary.shirima@school.com',
    gender: 'Female',
    subjects: ['ENG'],
    qualification: 'BA English',
    experience: '7 years',
    employeeId: 'TCH002'
  },
  {
    firstName: 'James',
    lastName: 'Mushi',
    email: 'james.mushi@school.com',
    gender: 'Male',
    subjects: ['PHY', 'MATH'],
    qualification: 'BSc Physics',
    experience: '6 years',
    employeeId: 'TCH003'
  },
  {
    firstName: 'Grace',
    lastName: 'Mwakasege',
    email: 'grace.mwakasege@school.com',
    gender: 'Female',
    subjects: ['BIO'],
    qualification: 'BSc Biology',
    experience: '4 years',
    employeeId: 'TCH004'
  },
  {
    firstName: 'Peter',
    lastName: 'Kimaro',
    email: 'peter.kimaro@school.com',
    gender: 'Male',
    subjects: ['CHEM'],
    qualification: 'BSc Chemistry',
    experience: '8 years',
    employeeId: 'TCH005'
  },
  {
    firstName: 'Sarah',
    lastName: 'Mwakyusa',
    email: 'sarah.mwakyusa@school.com',
    gender: 'Female',
    subjects: ['KIS'],
    qualification: 'BA Kiswahili',
    experience: '5 years',
    employeeId: 'TCH006'
  },
  {
    firstName: 'David',
    lastName: 'Msangi',
    email: 'david.msangi@school.com',
    gender: 'Male',
    subjects: ['HIST', 'CIV'],
    qualification: 'BA History',
    experience: '6 years',
    employeeId: 'TCH007'
  },
  {
    firstName: 'Elizabeth',
    lastName: 'Mwakagile',
    email: 'elizabeth.mwakagile@school.com',
    gender: 'Female',
    subjects: ['GEO'],
    qualification: 'BSc Geography',
    experience: '4 years',
    employeeId: 'TCH008'
  },
  {
    firstName: 'Michael',
    lastName: 'Mwasanga',
    email: 'michael.mwasanga@school.com',
    gender: 'Male',
    subjects: ['COMP'],
    qualification: 'BSc Computer Science',
    experience: '7 years',
    employeeId: 'TCH009'
  },
  {
    firstName: 'Agnes',
    lastName: 'Kivuyo',
    email: 'agnes.kivuyo@school.com',
    gender: 'Female',
    subjects: ['BK', 'COMM'],
    qualification: 'BBA',
    experience: '5 years',
    employeeId: 'TCH010'
  },
  {
    firstName: 'Richard',
    lastName: 'Macha',
    email: 'richard.macha@school.com',
    gender: 'Male',
    subjects: ['MATH', 'PHY'],
    qualification: 'BSc Mathematics',
    experience: '9 years',
    employeeId: 'TCH011'
  },
  {
    firstName: 'Joyce',
    lastName: 'Mfinanga',
    email: 'joyce.mfinanga@school.com',
    gender: 'Female',
    subjects: ['ENG', 'KIS'],
    qualification: 'BA Languages',
    experience: '6 years',
    employeeId: 'TCH012'
  },
  {
    firstName: 'Thomas',
    lastName: 'Mrema',
    email: 'thomas.mrema@school.com',
    gender: 'Male',
    subjects: ['BIO', 'CHEM'],
    qualification: 'BSc Biology',
    experience: '7 years',
    employeeId: 'TCH013'
  },
  {
    firstName: 'Lucy',
    lastName: 'Mwaikambo',
    email: 'lucy.mwaikambo@school.com',
    gender: 'Female',
    subjects: ['HIST', 'GEO'],
    qualification: 'BA Geography',
    experience: '5 years',
    employeeId: 'TCH014'
  }
];

// Classes configuration
const classes = [
  { name: 'Form 1', stream: 'A', section: 'Science', capacity: 50 },
  { name: 'Form 2', stream: 'A', section: 'Science', capacity: 50 },
  { name: 'Form 3', stream: 'A', section: 'Science', capacity: 50 },
  { name: 'Form 4', stream: 'A', section: 'Science', capacity: 50 }
];

// Exam types
const examTypes = [
  { name: 'Midterm Examination', description: 'Midterm assessment', maxMarks: 100, isActive: true },
  { name: 'Final Examination', description: 'Final term assessment', maxMarks: 100, isActive: true }
];

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

// Function to calculate points based on grade (Tanzania CSEE system)
function calculatePoints(grade) {
  switch(grade) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    case 'D': return 4;
    case 'F': return 5;
    default: return 0;
  }
}

// Function to calculate division based on points (Tanzania CSEE system)
function calculateDivision(totalPoints) {
  if (totalPoints >= 7 && totalPoints <= 14) return 'I';
  if (totalPoints >= 15 && totalPoints <= 21) return 'II';
  if (totalPoints >= 22 && totalPoints <= 25) return 'III';
  if (totalPoints >= 26 && totalPoints <= 32) return 'IV';
  return '0';
}

// Function to generate random Tanzanian names
function generateTanzanianName() {
  const firstNames = [
    'Juma', 'Amina', 'Hassan', 'Fatima', 'Said', 'Zainab', 'Ibrahim', 'Maryam',
    'Rashid', 'Aisha', 'Omar', 'Khadija', 'Salim', 'Rehema', 'Abdul', 'Jamila',
    'Hamisi', 'Halima', 'Bakari', 'Saida', 'Kassim', 'Mwajuma', 'Ally', 'Hadija',
    'Selemani', 'Mariamu', 'Jaffar', 'Zuhura', 'Mussa', 'Ashura', 'Shabani', 'Tatu'
  ];

  const lastNames = [
    'Mushi', 'Kimaro', 'Shirima', 'Massawe', 'Mrema', 'Mfinanga', 'Msangi',
    'Mwakasege', 'Mwakyusa', 'Kivuyo', 'Macha', 'Mwaikambo', 'Swai', 'Temba',
    'Mwanga', 'Shayo', 'Mbwambo', 'Msuya', 'Lyimo', 'Mbise', 'Maro', 'Mmari',
    'Urassa', 'Mcharo', 'Tarimo', 'Mwambe', 'Kileo', 'Minde', 'Munisi', 'Mwasonga'
  ];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}

async function createComprehensiveSchoolData() {
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
      ExamType.deleteMany({}),
      Result.deleteMany({})
    ]);
    console.log('Existing data cleared');

    // Create academic year
    console.log('Creating academic year...');
    const academicYear = await AcademicYear.create({
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
    });
    console.log(`Created academic year: ${academicYear.name}`);

    // Create exam types
    console.log('Creating exam types...');
    const createdExamTypes = await ExamType.insertMany(examTypes);
    console.log(`Created ${createdExamTypes.length} exam types`);

    // Create subjects
    console.log('Creating subjects...');
    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`Created ${createdSubjects.length} subjects`);

    // Create teachers with user accounts
    console.log('Creating teachers...');
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
        subjects: teacherSubjects,
        status: 'active'
      });

      createdTeachers.push(teacherDoc);
    }
    console.log(`Created ${createdTeachers.length} teachers`);

    // Create classes and assign teachers to subjects
    console.log('Creating classes...');
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

      // Assign a class teacher (first qualified teacher)
      const classTeacher = createdTeachers[Math.floor(Math.random() * createdTeachers.length)];

      const classDoc = await Class.create({
        ...cls,
        academicYear: academicYear._id,
        classTeacher: classTeacher._id,
        subjects: classSubjects,
        students: [] // Will be populated as students are created
      });
      createdClasses.push(classDoc);
    }
    console.log(`Created ${createdClasses.length} classes`);

    // Create students and assign to classes
    console.log('Creating students...');
    const createdStudents = [];
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
        const student = await Student.create({
          ...name,
          email,
          gender: Math.random() > 0.5 ? 'M' : 'F',
          class: cls._id,
          userId: user._id,
          rollNumber: `${cls.name.replace(' ', '')}-${(i + 1).toString().padStart(3, '0')}`
        });

        // Update class with student
        await Class.findByIdAndUpdate(cls._id, {
          $addToSet: { students: student._id }
        });

        createdStudents.push(student);
      }
    }
    console.log(`Created ${createdStudents.length} students`);

    // Create exams
    console.log('Creating exams...');
    const midtermExamType = createdExamTypes.find(et => et.name === 'Midterm Examination');
    const finalExamType = createdExamTypes.find(et => et.name === 'Final Examination');

    const midtermExam = await Exam.create({
      name: 'Midterm Examination Term 1',
      type: 'MID_TERM',
      term: 'Term 1',
      startDate: new Date('2023-10-15'),
      endDate: new Date('2023-10-25'),
      academicYear: academicYear._id,
      status: 'COMPLETED',
      classes: createdClasses.map(cls => ({
        class: cls._id,
        subjects: cls.subjects.map(s => ({
          subject: s.subject,
          maxMarks: 100
        }))
      }))
    });

    const finalExam = await Exam.create({
      name: 'Final Examination Term 1',
      type: 'FINAL',
      term: 'Term 1',
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-10'),
      academicYear: academicYear._id,
      status: 'COMPLETED',
      classes: createdClasses.map(cls => ({
        class: cls._id,
        subjects: cls.subjects.map(s => ({
          subject: s.subject,
          maxMarks: 100
        }))
      }))
    });

    console.log(`Created exams: ${midtermExam.name}, ${finalExam.name}`);

    // Generate results for all students
    console.log('Generating results...');
    const results = [];

    // For each student
    for (const student of createdStudents) {
      const studentClass = await Class.findById(student.class).populate('subjects.subject subjects.teacher');

      // For each exam
      for (const exam of [midtermExam, finalExam]) {
        const examType = exam.type === 'MID_TERM' ? midtermExamType : finalExamType;

        // For each subject in the class
        for (const classSubject of studentClass.subjects) {
          const marks = generateRandomMarks();
          const grade = calculateGrade(marks);
          const points = calculatePoints(grade);

          const result = await Result.create({
            studentId: student._id,
            examId: exam._id,
            academicYearId: academicYear._id,
            examTypeId: examType._id,
            subjectId: classSubject.subject._id,
            marksObtained: marks,
            grade,
            comment: `${grade} - ${marks >= 45 ? 'Pass' : 'Fail'}`
          });

          results.push(result);
        }
      }
    }
    console.log(`Generated ${results.length} results`);

    // Calculate and store rankings, divisions, etc.
    console.log('Calculating rankings and divisions...');

    // Group students by class
    const classesByIds = {};
    for (const cls of createdClasses) {
      classesByIds[cls._id.toString()] = cls;
    }

    // Group students by class
    const studentsByClass = {};
    for (const student of createdStudents) {
      const classId = student.class.toString();
      if (!studentsByClass[classId]) {
        studentsByClass[classId] = [];
      }
      studentsByClass[classId].push(student);
    }

    // For each exam
    for (const exam of [midtermExam, finalExam]) {
      // For each class
      for (const classId in studentsByClass) {
        const students = studentsByClass[classId];
        const classObj = classesByIds[classId];

        // Calculate total marks and average for each student
        const studentResults = [];

        for (const student of students) {
          // Get all results for this student in this exam
          const studentExamResults = await Result.find({
            studentId: student._id,
            examId: exam._id
          }).populate('subjectId');

          if (studentExamResults.length === 0) continue;

          // Calculate total marks and points
          let totalMarks = 0;
          let totalPoints = 0;
          const subjectResults = [];

          for (const result of studentExamResults) {
            totalMarks += result.marksObtained;
            totalPoints += calculatePoints(result.grade);

            subjectResults.push({
              subject: result.subjectId,
              marks: result.marksObtained,
              grade: result.grade,
              points: calculatePoints(result.grade)
            });
          }

          // Sort subject results by points (best subjects first)
          subjectResults.sort((a, b) => a.points - b.points);

          // Take best 7 subjects for division calculation (Tanzania CSEE system)
          const bestSevenSubjects = subjectResults.slice(0, 7);
          const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

          const average = totalMarks / studentExamResults.length;
          const division = calculateDivision(bestSevenPoints);

          studentResults.push({
            student,
            totalMarks,
            average,
            totalPoints,
            bestSevenPoints,
            division,
            subjectResults
          });
        }

        // Sort students by average marks (descending)
        studentResults.sort((a, b) => b.average - a.average);

        // Assign rankings
        for (let i = 0; i < studentResults.length; i++) {
          studentResults[i].rank = i + 1;
        }

        console.log(`Calculated rankings for ${classObj.name} - ${exam.name}: ${studentResults.length} students`);
      }
    }

    console.log('Successfully created all comprehensive school data');
  } catch (error) {
    console.error('Error creating comprehensive school data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createComprehensiveSchoolData();
