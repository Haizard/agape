const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const TeacherAssignment = require('../models/TeacherAssignment');
const Subject = require('../models/Subject');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function fixTeacherSubjectAssignments() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all teachers
    console.log('Finding all teachers...');
    const teachers = await Teacher.find();
    console.log(`Found ${teachers.length} teachers`);

    // Find all classes
    console.log('Finding all classes...');
    const classes = await Class.find().populate('subjects.subject');
    console.log(`Found ${classes.length} classes`);

    // Find all teacher assignments
    console.log('Finding all teacher assignments...');
    const teacherAssignments = await TeacherAssignment.find();
    console.log(`Found ${teacherAssignments.length} teacher assignments`);

    // Step 1: Ensure all teacher assignments are reflected in the Class model
    console.log('\nStep 1: Ensuring all teacher assignments are reflected in the Class model...');
    for (const assignment of teacherAssignments) {
      console.log(`\nProcessing assignment: Teacher ${assignment.teacher} teaching Subject ${assignment.subject} in Class ${assignment.class}`);
      
      // Find the class
      const classObj = classes.find(c => c._id.toString() === assignment.class.toString());
      if (!classObj) {
        console.log(`Class not found for assignment: ${assignment._id}`);
        continue;
      }
      
      // Check if this subject-teacher pair is already in the class
      let subjectExists = false;
      for (const subjectAssignment of classObj.subjects || []) {
        if (subjectAssignment.subject && 
            subjectAssignment.subject._id.toString() === assignment.subject.toString()) {
          // Subject exists, update the teacher if needed
          if (!subjectAssignment.teacher || 
              subjectAssignment.teacher.toString() !== assignment.teacher.toString()) {
            subjectAssignment.teacher = assignment.teacher;
            console.log(`Updated teacher for subject ${assignment.subject} in class ${assignment.class}`);
          } else {
            console.log(`Teacher already assigned to subject ${assignment.subject} in class ${assignment.class}`);
          }
          subjectExists = true;
          break;
        }
      }
      
      // If subject doesn't exist in this class, add it
      if (!subjectExists) {
        if (!classObj.subjects) {
          classObj.subjects = [];
        }
        classObj.subjects.push({
          subject: assignment.subject,
          teacher: assignment.teacher
        });
        console.log(`Added subject ${assignment.subject} with teacher ${assignment.teacher} to class ${assignment.class}`);
      }
    }
    
    // Save all updated classes
    console.log('\nSaving updated classes...');
    for (const classObj of classes) {
      if (classObj.isModified && classObj.isModified()) {
        await classObj.save();
        console.log(`Saved class ${classObj._id}`);
      }
    }
    
    // Step 2: Ensure all teachers have the subjects they teach in their profiles
    console.log('\nStep 2: Ensuring all teachers have the subjects they teach in their profiles...');
    for (const classObj of classes) {
      console.log(`\nProcessing class: ${classObj.name}`);
      
      for (const subjectAssignment of classObj.subjects || []) {
        if (!subjectAssignment.teacher || !subjectAssignment.subject) continue;
        
        // Find the teacher
        const teacher = teachers.find(t => t._id.toString() === subjectAssignment.teacher.toString());
        if (!teacher) {
          console.log(`Teacher not found for subject assignment in class ${classObj._id}`);
          continue;
        }
        
        // Check if this subject is already in the teacher's subjects
        const subjectId = typeof subjectAssignment.subject === 'object' ? 
          subjectAssignment.subject._id.toString() : 
          subjectAssignment.subject.toString();
        
        const hasSubject = teacher.subjects.some(s => s.toString() === subjectId);
        
        // If not, add it
        if (!hasSubject) {
          teacher.subjects.push(subjectAssignment.subject);
          console.log(`Added subject ${subjectId} to teacher ${teacher._id}`);
        } else {
          console.log(`Teacher ${teacher._id} already has subject ${subjectId}`);
        }
      }
    }
    
    // Save all updated teachers
    console.log('\nSaving updated teachers...');
    for (const teacher of teachers) {
      if (teacher.isModified && teacher.isModified()) {
        await teacher.save();
        console.log(`Saved teacher ${teacher._id}`);
      }
    }
    
    // Step 3: Create TeacherAssignment records for all subject-teacher pairs in classes
    console.log('\nStep 3: Creating TeacherAssignment records for all subject-teacher pairs in classes...');
    for (const classObj of classes) {
      console.log(`\nProcessing class: ${classObj.name}`);
      
      for (const subjectAssignment of classObj.subjects || []) {
        if (!subjectAssignment.teacher || !subjectAssignment.subject) continue;
        
        // Check if this assignment already exists
        const existingAssignment = teacherAssignments.find(a => 
          a.teacher.toString() === subjectAssignment.teacher.toString() && 
          a.subject.toString() === (typeof subjectAssignment.subject === 'object' ? 
            subjectAssignment.subject._id.toString() : 
            subjectAssignment.subject.toString()) && 
          a.class.toString() === classObj._id.toString()
        );
        
        if (!existingAssignment) {
          // Create a new assignment
          const newAssignment = new TeacherAssignment({
            teacher: subjectAssignment.teacher,
            subject: typeof subjectAssignment.subject === 'object' ? 
              subjectAssignment.subject._id : 
              subjectAssignment.subject,
            class: classObj._id,
            academicYear: classObj.academicYear,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          });
          
          await newAssignment.save();
          console.log(`Created new teacher assignment for teacher ${subjectAssignment.teacher} teaching subject ${subjectAssignment.subject} in class ${classObj._id}`);
        } else {
          console.log(`Assignment already exists for teacher ${subjectAssignment.teacher} teaching subject ${subjectAssignment.subject} in class ${classObj._id}`);
        }
      }
    }
    
    console.log('\nTeacher subject assignments fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing teacher subject assignments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixTeacherSubjectAssignments();
