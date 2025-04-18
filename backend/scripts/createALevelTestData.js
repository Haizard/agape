/**
 * Script to create test data for A-Level Class Report
 * 
 * This script creates the necessary data for testing the A-Level Class Report:
 * - Class with educationLevel: "A_LEVEL"
 * - Exam
 * - Students with educationLevel: "A_LEVEL"
 * - Subjects with educationLevel: "A_LEVEL"
 * - SubjectCombination
 * - ALevelResult records
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import models
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const SubjectCombination = require('../models/SubjectCombination');
const ALevelResult = require('../models/ALevelResult');
const AcademicYear = require('../models/AcademicYear');
const User = require('../models/User');
const ExamType = require('../models/ExamType');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/john_vianey', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  createTestData().catch(err => {
    console.error('Error creating test data:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

/**
 * Create test data for A-Level Class Report
 */
async function createTestData() {
  try {
    console.log('Creating test data for A-Level Class Report...');

    // Create or find academic year
    let academicYear = await AcademicYear.findOne({ year: 2023 });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        name: '2023-2024',
        year: 2023,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        isActive: true,
        educationLevel: 'A_LEVEL',
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-04-30')
          },
          {
            name: 'Term 2',
            startDate: new Date('2023-05-01'),
            endDate: new Date('2023-08-31')
          },
          {
            name: 'Term 3',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-12-31')
          }
        ]
      });
      console.log('Created academic year:', academicYear._id);
    } else {
      console.log('Found existing academic year:', academicYear._id);
    }

    // Create or find exam type
    let examType = await ExamType.findOne({ name: 'Mid-Term Exam' });
    if (!examType) {
      examType = await ExamType.create({
        name: 'Mid-Term Exam',
        description: 'Mid-Term Examination',
        maxMarks: 100,
        isActive: true
      });
      console.log('Created exam type:', examType._id);
    } else {
      console.log('Found existing exam type:', examType._id);
    }

    // Create or find class
    let classObj = await Class.findOne({ 
      name: 'Form 5', 
      educationLevel: 'A_LEVEL',
      academicYear: academicYear._id
    });
    
    if (!classObj) {
      classObj = await Class.create({
        name: 'Form 5',
        stream: 'Science',
        section: 'A',
        educationLevel: 'A_LEVEL',
        academicYear: academicYear._id,
        capacity: 40,
        students: []
      });
      console.log('Created class:', classObj._id);
    } else {
      console.log('Found existing class:', classObj._id);
    }

    // Create or find exam
    let exam = await Exam.findOne({ 
      name: 'Mid-Term Exam 2023',
      academicYear: academicYear._id
    });
    
    if (!exam) {
      exam = await Exam.create({
        name: 'Mid-Term Exam 2023',
        type: 'MID_TERM',
        examType: examType._id,
        academicYear: academicYear._id,
        term: 'Term 1',
        startDate: new Date('2023-03-01'),
        endDate: new Date('2023-03-15'),
        status: 'COMPLETED',
        educationLevel: 'A_LEVEL',
        classes: [{
          class: classObj._id
        }]
      });
      console.log('Created exam:', exam._id);
    } else {
      console.log('Found existing exam:', exam._id);
    }

    // Create or find subjects
    const subjectData = [
      { name: 'Physics', code: 'PHY', isPrincipal: true },
      { name: 'Chemistry', code: 'CHE', isPrincipal: true },
      { name: 'Mathematics', code: 'MAT', isPrincipal: true },
      { name: 'Biology', code: 'BIO', isPrincipal: true },
      { name: 'General Studies', code: 'GS', isPrincipal: false }
    ];

    const subjects = [];
    for (const data of subjectData) {
      let subject = await Subject.findOne({ code: data.code });
      if (!subject) {
        subject = await Subject.create({
          name: data.name,
          code: data.code,
          educationLevel: 'A_LEVEL',
          isPrincipal: data.isPrincipal,
          isCompulsory: data.code === 'GS',
          type: 'CORE',
          passMark: 40
        });
        console.log(`Created subject: ${subject.name} (${subject._id})`);
      } else {
        console.log(`Found existing subject: ${subject.name} (${subject._id})`);
      }
      subjects.push(subject);
    }

    // Create or find subject combination
    let subjectCombination = await SubjectCombination.findOne({ code: 'PCM' });
    if (!subjectCombination) {
      subjectCombination = await SubjectCombination.create({
        name: 'Physics, Chemistry, Mathematics',
        code: 'PCM',
        educationLevel: 'A_LEVEL',
        description: 'Science combination for engineering fields',
        subjects: subjects.map(s => s._id),
        compulsorySubjects: [subjects.find(s => s.code === 'GS')._id],
        isActive: true
      });
      console.log('Created subject combination:', subjectCombination._id);
    } else {
      console.log('Found existing subject combination:', subjectCombination._id);
    }

    // Update class with subject combination
    await Class.findByIdAndUpdate(classObj._id, {
      subjectCombination: subjectCombination._id
    });

    // Create or find students
    const studentData = [
      { firstName: 'John', lastName: 'Smith', gender: 'male', form: 5 },
      { firstName: 'Jane', lastName: 'Doe', gender: 'female', form: 5 },
      { firstName: 'Michael', lastName: 'Johnson', gender: 'male', form: 5 },
      { firstName: 'Emily', lastName: 'Williams', gender: 'female', form: 5 },
      { firstName: 'David', lastName: 'Brown', gender: 'male', form: 5 }
    ];

    const students = [];
    for (let i = 0; i < studentData.length; i++) {
      const data = studentData[i];
      
      // Create user for student
      let user = await User.findOne({ email: `student${i+1}@example.com` });
      if (!user) {
        user = await User.create({
          username: `student${i+1}`,
          email: `student${i+1}@example.com`,
          password: '$2a$10$X7VYJfR8ZVEeb5GxRmqj5.WZN1QnKJY5HBFT.xcmtgvz9bFcYYnAa', // password123
          role: 'student',
          isActive: true
        });
        console.log(`Created user: ${user.username} (${user._id})`);
      } else {
        console.log(`Found existing user: ${user.username} (${user._id})`);
      }
      
      // Create student
      let student = await Student.findOne({ 
        firstName: data.firstName,
        lastName: data.lastName,
        class: classObj._id
      });
      
      if (!student) {
        student = await Student.create({
          userId: user._id,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          class: classObj._id,
          educationLevel: 'A_LEVEL',
          form: data.form,
          admissionNumber: `A${2023}${i+1}`,
          rollNumber: `F${data.form}${data.gender === 'male' ? 'B' : 'G'}${(i+1).toString().padStart(3, '0')}`,
          subjectCombination: subjectCombination._id
        });
        console.log(`Created student: ${student.firstName} ${student.lastName} (${student._id})`);
      } else {
        console.log(`Found existing student: ${student.firstName} ${student.lastName} (${student._id})`);
      }
      
      students.push(student);
      
      // Add student to class if not already added
      if (!classObj.students.includes(student._id)) {
        classObj.students.push(student._id);
      }
    }
    
    // Save updated class
    await classObj.save();
    console.log('Updated class with students');

    // Create A-Level results
    for (const student of students) {
      for (const subject of subjects) {
        // Check if result already exists
        let result = await ALevelResult.findOne({
          studentId: student._id,
          examId: exam._id,
          subjectId: subject._id
        });
        
        if (!result) {
          // Generate random marks between 40 and 100
          const marks = Math.floor(Math.random() * 61) + 40;
          
          result = await ALevelResult.create({
            studentId: student._id,
            examId: exam._id,
            academicYearId: academicYear._id,
            examTypeId: examType._id,
            subjectId: subject._id,
            classId: classObj._id,
            marksObtained: marks,
            isPrincipal: subject.isPrincipal,
            
            // Alias fields for compatibility
            student: student._id,
            exam: exam._id,
            academicYear: academicYear._id,
            examType: examType._id,
            subject: subject._id,
            class: classObj._id
          });
          console.log(`Created result for ${student.firstName} ${student.lastName} in ${subject.name}: ${marks}`);
        } else {
          console.log(`Found existing result for ${student.firstName} ${student.lastName} in ${subject.name}`);
        }
      }
    }

    console.log('\nTest data creation completed successfully!');
    console.log('\nUse the following IDs for testing:');
    console.log(`Class ID: ${classObj._id}`);
    console.log(`Exam ID: ${exam._id}`);
    console.log(`Form Level: 5`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}
