/**
 * Diagnostic script to check teacher assignments and fix issues
 * 
 * Run this script with: node diagnose-teacher.js
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const User = require('./models/User');
const TeacherSubject = require('./models/TeacherSubject');
const TeacherAssignment = require('./models/TeacherAssignment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

async function diagnoseTeacher() {
  try {
    // 1. Find the teacher by username
    const username = 'KAAYA'; // Replace with the actual username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`User with username ${username} not found`);
      return;
    }
    
    console.log(`Found user: ${user.username} (${user._id})`);
    
    // 2. Find the teacher profile
    const teacher = await Teacher.findOne({ userId: user._id });
    
    if (!teacher) {
      console.log(`Teacher profile for user ${user.username} not found`);
      console.log('Creating teacher profile...');
      
      // Create a teacher profile
      const newTeacher = new Teacher({
        userId: user._id,
        firstName: user.username,
        lastName: '',
        email: user.email,
        qualification: 'Teacher',
        experience: '1 year',
        employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
        status: 'active'
      });
      
      await newTeacher.save();
      console.log(`Created teacher profile: ${newTeacher._id}`);
      return;
    }
    
    console.log(`Found teacher profile: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);
    
    // 3. Find the class
    const classId = '67fdfc962cc25690fef0298e'; // Replace with the actual class ID
    const classObj = await Class.findById(classId).populate('subjects.subject');
    
    if (!classObj) {
      console.log(`Class with ID ${classId} not found`);
      return;
    }
    
    console.log(`Found class: ${classObj.name} (${classObj._id})`);
    
    // 4. Check if the teacher is assigned to any subjects in the class
    const teacherSubjects = classObj.subjects.filter(s => 
      s.teacher && s.teacher.toString() === teacher._id.toString()
    );
    
    console.log(`Teacher is assigned to ${teacherSubjects.length} subjects in class ${classObj.name}`);
    
    if (teacherSubjects.length === 0) {
      console.log('Assigning teacher to all subjects in the class...');
      
      // Assign the teacher to all subjects in the class
      for (let i = 0; i < classObj.subjects.length; i++) {
        classObj.subjects[i].teacher = teacher._id;
        console.log(`Assigned teacher to subject: ${classObj.subjects[i].subject.name || 'Unknown'}`);
      }
      
      await classObj.save();
      console.log('Teacher assigned to all subjects successfully');
    } else {
      // List the subjects the teacher is assigned to
      teacherSubjects.forEach(s => {
        console.log(`Teacher is assigned to subject: ${s.subject.name || 'Unknown'}`);
      });
    }
    
    // 5. Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacher._id,
      classId: classObj._id
    }).populate('subjectId');
    
    console.log(`Found ${teacherSubjectAssignments.length} TeacherSubject assignments`);
    
    if (teacherSubjectAssignments.length === 0) {
      console.log('Creating TeacherSubject assignments...');
      
      // Create TeacherSubject assignments for all subjects in the class
      for (const subject of classObj.subjects) {
        if (!subject.subject) continue;
        
        const teacherSubject = new TeacherSubject({
          teacherId: teacher._id,
          subjectId: subject.subject._id,
          classId: classObj._id
        });
        
        await teacherSubject.save();
        console.log(`Created TeacherSubject assignment for subject: ${subject.subject.name || 'Unknown'}`);
      }
    } else {
      // List the TeacherSubject assignments
      teacherSubjectAssignments.forEach(ts => {
        console.log(`TeacherSubject assignment: ${ts.subjectId.name || 'Unknown'}`);
      });
    }
    
    // 6. Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacher._id,
      class: classObj._id
    }).populate('subject');
    
    console.log(`Found ${teacherAssignments.length} TeacherAssignment assignments`);
    
    if (teacherAssignments.length === 0) {
      console.log('Creating TeacherAssignment assignments...');
      
      // Get the current academic year
      const AcademicYear = require('./models/AcademicYear');
      const academicYear = await AcademicYear.findOne({ isActive: true });
      
      if (!academicYear) {
        console.log('No active academic year found');
        return;
      }
      
      // Create TeacherAssignment assignments for all subjects in the class
      for (const subject of classObj.subjects) {
        if (!subject.subject) continue;
        
        const teacherAssignment = new TeacherAssignment({
          teacher: teacher._id,
          subject: subject.subject._id,
          class: classObj._id,
          academicYear: academicYear._id,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });
        
        await teacherAssignment.save();
        console.log(`Created TeacherAssignment for subject: ${subject.subject.name || 'Unknown'}`);
      }
    } else {
      // List the TeacherAssignment assignments
      teacherAssignments.forEach(ta => {
        console.log(`TeacherAssignment: ${ta.subject.name || 'Unknown'}`);
      });
    }
    
    console.log('Diagnosis complete. The teacher should now be properly assigned to all subjects in the class.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

diagnoseTeacher();
