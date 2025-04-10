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

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function fixTeacherAssignments() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find active academic year
    console.log('Finding active academic year...');
    const academicYear = await AcademicYear.findOne({ isActive: true });
    if (!academicYear) {
      throw new Error('No active academic year found');
    }
    console.log(`Found active academic year: ${academicYear.name}`);

    // Find all classes for the current academic year
    console.log('Finding classes for the current academic year...');
    const classes = await Class.find({ academicYear: academicYear._id })
      .populate('subjects.subject')
      .populate('subjects.teacher');
    
    if (classes.length === 0) {
      throw new Error('No classes found for the current academic year');
    }
    console.log(`Found ${classes.length} classes`);

    // Find all subjects
    console.log('Finding all subjects...');
    const subjects = await Subject.find();
    if (subjects.length === 0) {
      throw new Error('No subjects found');
    }
    console.log(`Found ${subjects.length} subjects`);

    // Find all teachers
    console.log('Finding all teachers...');
    const teachers = await Teacher.find().populate('userId');
    if (teachers.length === 0) {
      throw new Error('No teachers found');
    }
    console.log(`Found ${teachers.length} teachers`);

    // Display teacher information
    console.log('\nTeacher Information:');
    for (const teacher of teachers) {
      console.log(`\nTeacher: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`Email: ${teacher.email}`);
      console.log(`Username: ${teacher.userId ? teacher.userId.username : 'No user account'}`);
      
      // Find subjects assigned to this teacher
      const teacherSubjects = [];
      for (const cls of classes) {
        for (const subjectAssignment of cls.subjects) {
          if (subjectAssignment.teacher && 
              subjectAssignment.teacher._id.toString() === teacher._id.toString()) {
            const subjectName = subjectAssignment.subject ? subjectAssignment.subject.name : 'Unknown Subject';
            teacherSubjects.push({
              class: cls.name,
              subject: subjectName
            });
          }
        }
      }
      
      console.log('Assigned Classes and Subjects:');
      if (teacherSubjects.length === 0) {
        console.log('  No classes or subjects assigned');
      } else {
        teacherSubjects.forEach((assignment, index) => {
          console.log(`  ${index + 1}. Class: ${assignment.class}, Subject: ${assignment.subject}`);
        });
      }
    }

    // Fix teacher assignments
    console.log('\nFixing teacher assignments...');
    
    // Ensure each teacher has at least one subject and class assigned
    for (const teacher of teachers) {
      // Check if teacher has any class assignments
      let hasAssignments = false;
      
      for (const cls of classes) {
        for (const subjectAssignment of cls.subjects) {
          if (subjectAssignment.teacher && 
              subjectAssignment.teacher._id.toString() === teacher._id.toString()) {
            hasAssignments = true;
            break;
          }
        }
        if (hasAssignments) break;
      }
      
      // If teacher has no assignments, assign them to at least one class and subject
      if (!hasAssignments) {
        console.log(`Teacher ${teacher.firstName} ${teacher.lastName} has no assignments. Adding assignments...`);
        
        // Find subjects this teacher can teach (from their profile)
        const teachableSubjects = teacher.subjects || [];
        
        if (teachableSubjects.length === 0 && subjects.length > 0) {
          // If teacher has no subjects in their profile, assign them a random subject
          const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
          teachableSubjects.push(randomSubject._id);
          
          // Update teacher profile with this subject
          await Teacher.findByIdAndUpdate(teacher._id, {
            $addToSet: { subjects: randomSubject._id }
          });
          
          console.log(`Assigned subject ${randomSubject.name} to teacher's profile`);
        }
        
        // Assign teacher to a class for each of their subjects
        for (const subjectId of teachableSubjects) {
          // Find a class that doesn't have a teacher for this subject
          for (const cls of classes) {
            let subjectAssigned = false;
            
            // Check if this subject is already in the class
            for (const subjectAssignment of cls.subjects) {
              if (subjectAssignment.subject && 
                  subjectAssignment.subject._id.toString() === subjectId.toString()) {
                // Subject already exists in this class, update the teacher
                if (!subjectAssignment.teacher) {
                  // Update the existing subject assignment with this teacher
                  await Class.updateOne(
                    { 
                      _id: cls._id, 
                      'subjects.subject': subjectId 
                    },
                    { 
                      $set: { 'subjects.$.teacher': teacher._id } 
                    }
                  );
                  
                  console.log(`Assigned teacher to existing subject in class ${cls.name}`);
                  subjectAssigned = true;
                  break;
                }
              }
            }
            
            if (!subjectAssigned) {
              // Subject not found in class, add it with this teacher
              const subjectObj = await Subject.findById(subjectId);
              if (subjectObj) {
                await Class.findByIdAndUpdate(cls._id, {
                  $addToSet: { 
                    subjects: { 
                      subject: subjectId, 
                      teacher: teacher._id 
                    } 
                  }
                });
                
                console.log(`Added new subject ${subjectObj.name} to class ${cls.name} with teacher`);
                break;
              }
            }
          }
        }
      }
    }
    
    console.log('\nTeacher assignments fixed successfully');
    
    // Verify teacher assignments after fixes
    console.log('\nVerifying teacher assignments after fixes...');
    
    // Reload classes with updated data
    const updatedClasses = await Class.find({ academicYear: academicYear._id })
      .populate('subjects.subject')
      .populate('subjects.teacher');
    
    for (const teacher of teachers) {
      console.log(`\nTeacher: ${teacher.firstName} ${teacher.lastName}`);
      
      // Find subjects assigned to this teacher after fixes
      const teacherSubjects = [];
      for (const cls of updatedClasses) {
        for (const subjectAssignment of cls.subjects) {
          if (subjectAssignment.teacher && 
              subjectAssignment.teacher._id.toString() === teacher._id.toString()) {
            const subjectName = subjectAssignment.subject ? subjectAssignment.subject.name : 'Unknown Subject';
            teacherSubjects.push({
              class: cls.name,
              subject: subjectName
            });
          }
        }
      }
      
      console.log('Assigned Classes and Subjects after fixes:');
      if (teacherSubjects.length === 0) {
        console.log('  Still no classes or subjects assigned - manual intervention required');
      } else {
        teacherSubjects.forEach((assignment, index) => {
          console.log(`  ${index + 1}. Class: ${assignment.class}, Subject: ${assignment.subject}`);
        });
      }
    }
    
    console.log('\nTeacher Login Information:');
    for (const teacher of teachers) {
      if (teacher.userId) {
        console.log(`\nTeacher: ${teacher.firstName} ${teacher.lastName}`);
        console.log(`Username: ${teacher.userId.username}`);
        console.log(`Email: ${teacher.email}`);
        console.log(`Password: password123 (default)`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing teacher assignments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixTeacherAssignments();
