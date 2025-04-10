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

async function createSimpleSchoolData() {
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
    const examTypes = await ExamType.insertMany([
      { name: 'Midterm', description: 'Midterm assessment', maxMarks: 100, isActive: true },
      { name: 'Final', description: 'Final term assessment', maxMarks: 100, isActive: true }
    ]);
    console.log(`Created ${examTypes.length} exam types`);

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
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        gender: teacher.gender,
        qualification: teacher.qualification,
        experience: teacher.experience,
        employeeId: teacher.employeeId,
        subjects: teacherSubjects,
        userId: user._id,
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

      // Assign a class teacher
      const classTeacher = createdTeachers[Math.floor(Math.random() * createdTeachers.length)];
      
      const classDoc = await Class.create({
        name: cls.name,
        stream: cls.stream,
        section: cls.section,
        capacity: cls.capacity,
        academicYear: academicYear._id,
        classTeacher: classTeacher._id,
        subjects: classSubjects,
        students: []
      });
      createdClasses.push(classDoc);
    }
    console.log(`Created ${createdClasses.length} classes`);

    // Create students and assign to classes
    console.log('Creating students...');
    const createdStudents = [];
    
    // Create 10 students per class for now (instead of 50) to make it faster
    const studentsPerClass = 10;
    
    for (const cls of createdClasses) {
      for (let i = 0; i < studentsPerClass; i++) {
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
          firstName: name.firstName,
          lastName: name.lastName,
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
    const midtermExamType = examTypes.find(et => et.name === 'Midterm');
    const finalExamType = examTypes.find(et => et.name === 'Final');
    
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
    let resultCount = 0;
    
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
          
          resultCount++;
        }
      }
    }
    console.log(`Generated ${resultCount} results`);

    console.log('Successfully created all school data');
    console.log('\nReference IDs for testing:');
    console.log('Academic Year ID:', academicYear._id);
    console.log('Midterm Exam ID:', midtermExam._id);
    console.log('Final Exam ID:', finalExam._id);
    
    // Print some sample student IDs
    console.log('\nSample Student IDs:');
    for (let i = 0; i < Math.min(5, createdStudents.length); i++) {
      console.log(`Student ${i+1}: ${createdStudents[i]._id} (${createdStudents[i].firstName} ${createdStudents[i].lastName})`);
    }
    
    // Print some sample class IDs
    console.log('\nClass IDs:');
    for (const cls of createdClasses) {
      console.log(`${cls.name}: ${cls._id}`);
    }
    
  } catch (error) {
    console.error('Error creating school data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createSimpleSchoolData();
