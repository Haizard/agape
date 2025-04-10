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

// Function to generate a unique employee ID
async function generateUniqueEmployeeId(prefix = 'TCH', startNumber = 1) {
  let isUnique = false;
  let employeeId;
  let counter = startNumber;
  
  while (!isUnique) {
    employeeId = `${prefix}${counter.toString().padStart(3, '0')}`;
    const existingTeacher = await Teacher.findOne({ employeeId });
    if (!existingTeacher) {
      isUnique = true;
    } else {
      counter++;
    }
  }
  
  return employeeId;
}

// Function to generate a unique roll number
async function generateUniqueRollNumber(className, startNumber = 1) {
  let isUnique = false;
  let rollNumber;
  let counter = startNumber;
  
  while (!isUnique) {
    rollNumber = `${className.replace(' ', '')}-${counter.toString().padStart(3, '0')}`;
    const existingStudent = await Student.findOne({ rollNumber });
    if (!existingStudent) {
      isUnique = true;
    } else {
      counter++;
    }
  }
  
  return rollNumber;
}

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

async function createUniqueSchoolData() {
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

    // Create 14 teachers with unique employee IDs
    console.log('Creating teachers...');
    const teacherData = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@school.com', subjects: [0, 2] },
      { firstName: 'Mary', lastName: 'Johnson', email: 'mary.johnson@school.com', subjects: [1] },
      { firstName: 'David', lastName: 'Williams', email: 'david.williams@school.com', subjects: [0, 2] },
      { firstName: 'Sarah', lastName: 'Brown', email: 'sarah.brown@school.com', subjects: [1, 2] }
    ];
    
    const teachers = [];
    for (const data of teacherData) {
      // Check if teacher already exists
      let teacher = await Teacher.findOne({ email: data.email });
      
      if (!teacher) {
        // Check if user exists
        let user = await User.findOne({ email: data.email });
        
        if (!user) {
          // Create user
          const password = await bcrypt.hash('password123', 10);
          user = await User.create({
            username: data.email.split('@')[0],
            email: data.email,
            password,
            role: 'teacher'
          });
          console.log(`Created user for teacher: ${user.username}`);
        } else {
          console.log(`Found existing user for teacher: ${user.username}`);
        }
        
        // Generate unique employee ID
        const employeeId = await generateUniqueEmployeeId();
        
        // Create teacher
        teacher = await Teacher.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          gender: 'Male',
          qualification: 'BSc Education',
          experience: '5 years',
          employeeId,
          subjects: data.subjects.map(index => subjects[index]._id),
          userId: user._id,
          status: 'active'
        });
        console.log(`Created teacher: ${teacher.firstName} ${teacher.lastName} with ID ${employeeId}`);
      } else {
        console.log(`Found existing teacher: ${teacher.firstName} ${teacher.lastName}`);
      }
      
      teachers.push(teacher);
    }

    // Create classes
    console.log('Creating classes...');
    const classData = [
      { name: 'Form 1', stream: 'A', section: 'Science', capacity: 50 },
      { name: 'Form 2', stream: 'A', section: 'Science', capacity: 50 },
      { name: 'Form 3', stream: 'A', section: 'Science', capacity: 50 },
      { name: 'Form 4', stream: 'A', section: 'Science', capacity: 50 }
    ];
    
    const classes = [];
    for (const data of classData) {
      // Check if class already exists
      let classObj = await Class.findOne({ 
        name: data.name, 
        stream: data.stream,
        academicYear: academicYear._id 
      });
      
      if (!classObj) {
        // Assign subjects and teachers
        const classSubjects = [];
        for (const subject of subjects) {
          // Find teachers who can teach this subject
          const qualifiedTeachers = teachers.filter(t => 
            t.subjects.some(s => s.toString() === subject._id.toString())
          );
          
          if (qualifiedTeachers.length > 0) {
            // Randomly select a teacher
            const teacher = qualifiedTeachers[Math.floor(Math.random() * qualifiedTeachers.length)];
            classSubjects.push({
              subject: subject._id,
              teacher: teacher._id
            });
          }
        }
        
        // Assign a class teacher
        const classTeacher = teachers[Math.floor(Math.random() * teachers.length)];
        
        // Create class
        classObj = await Class.create({
          name: data.name,
          stream: data.stream,
          section: data.section,
          capacity: data.capacity,
          academicYear: academicYear._id,
          classTeacher: classTeacher._id,
          subjects: classSubjects,
          students: []
        });
        console.log(`Created class: ${classObj.name} ${classObj.stream}`);
      } else {
        console.log(`Found existing class: ${classObj.name} ${classObj.stream}`);
      }
      
      classes.push(classObj);
    }

    // Create students (10 per class)
    console.log('Creating students...');
    const studentNames = [
      { firstName: 'Alice', lastName: 'Johnson' },
      { firstName: 'Bob', lastName: 'Smith' },
      { firstName: 'Charlie', lastName: 'Williams' },
      { firstName: 'Diana', lastName: 'Brown' },
      { firstName: 'Edward', lastName: 'Jones' },
      { firstName: 'Fiona', lastName: 'Miller' },
      { firstName: 'George', lastName: 'Davis' },
      { firstName: 'Hannah', lastName: 'Wilson' },
      { firstName: 'Ian', lastName: 'Taylor' },
      { firstName: 'Julia', lastName: 'Anderson' }
    ];
    
    const students = [];
    for (const classObj of classes) {
      for (let i = 0; i < studentNames.length; i++) {
        const name = studentNames[i];
        const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i}@student.school.com`;
        
        // Check if student already exists
        let student = await Student.findOne({ 
          firstName: name.firstName,
          lastName: name.lastName,
          class: classObj._id
        });
        
        if (!student) {
          // Check if user exists
          let user = await User.findOne({ email });
          
          if (!user) {
            // Create user
            const password = await bcrypt.hash('password123', 10);
            user = await User.create({
              username: email.split('@')[0],
              email,
              password,
              role: 'student'
            });
            console.log(`Created user for student: ${user.username}`);
          } else {
            console.log(`Found existing user for student: ${user.username}`);
          }
          
          // Generate unique roll number
          const rollNumber = await generateUniqueRollNumber(classObj.name);
          
          // Create student
          student = await Student.create({
            firstName: name.firstName,
            lastName: name.lastName,
            gender: i % 2 === 0 ? 'M' : 'F',
            class: classObj._id,
            userId: user._id,
            rollNumber
          });
          console.log(`Created student: ${student.firstName} ${student.lastName} with roll number ${rollNumber}`);
          
          // Update class with student
          await Class.findByIdAndUpdate(classObj._id, {
            $addToSet: { students: student._id }
          });
        } else {
          console.log(`Found existing student: ${student.firstName} ${student.lastName}`);
        }
        
        students.push(student);
      }
    }

    // Create exam
    console.log('Creating exam...');
    let exam = await Exam.findOne({ 
      name: 'Midterm Examination Term 1',
      academicYear: academicYear._id
    });
    
    if (!exam) {
      exam = await Exam.create({
        name: 'Midterm Examination Term 1',
        type: 'MID_TERM',
        term: 'Term 1',
        startDate: new Date('2023-10-15'),
        endDate: new Date('2023-10-25'),
        academicYear: academicYear._id,
        status: 'COMPLETED',
        classes: classes.map(cls => ({
          class: cls._id,
          subjects: subjects.map(subject => ({
            subject: subject._id,
            maxMarks: 100
          }))
        }))
      });
      console.log(`Created exam: ${exam.name}`);
    } else {
      console.log(`Found existing exam: ${exam.name}`);
    }

    // Generate results
    console.log('Generating results...');
    let resultCount = 0;
    
    for (const student of students) {
      const studentClass = await Class.findById(student.class).populate('subjects.subject subjects.teacher');
      
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
    console.log('\nSuccessfully created school data with unique IDs');
    
  } catch (error) {
    console.error('Error creating school data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createUniqueSchoolData();
