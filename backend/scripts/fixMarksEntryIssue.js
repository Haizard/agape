const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function fixMarksEntryIssue() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all teacher profiles
    console.log('Finding all teacher profiles...');
    const teacherProfiles = await Teacher.find().populate('userId');
    console.log(`Found ${teacherProfiles.length} teacher profiles`);

    // Find all classes
    console.log('Finding all classes...');
    const classes = await Class.find().populate('subjects.subject');
    console.log(`Found ${classes.length} classes`);

    // Find all subjects
    console.log('Finding all subjects...');
    const subjects = await Subject.find();
    console.log(`Found ${subjects.length} subjects`);

    // Find active academic year
    console.log('Finding active academic year...');
    let academicYear = await AcademicYear.findOne({ isActive: true });
    if (!academicYear) {
      console.log('No active academic year found, using most recent one...');
      academicYear = await AcademicYear.findOne().sort({ year: -1 });
      
      if (!academicYear) {
        console.log('No academic year found, creating a new one...');
        academicYear = await AcademicYear.create({
          name: '2023-2024',
          year: 2023,
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-08-31'),
          isActive: true,
          terms: [{
            name: 'Term 1',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-12-15')
          }]
        });
      }
    }
    console.log(`Using academic year: ${academicYear.name}`);

    // Process each teacher
    console.log('\nProcessing teachers...');
    for (const teacher of teacherProfiles) {
      console.log(`\nProcessing teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.employeeId})`);
      
      // Check if teacher has subjects
      if (!teacher.subjects || teacher.subjects.length === 0) {
        console.log('Teacher has no subjects, assigning random subjects...');
        
        // Assign random subjects (at least 2)
        const randomSubjects = [];
        const numSubjects = Math.min(subjects.length, Math.floor(2 + Math.random() * 3)); // 2-4 subjects
        
        for (let i = 0; i < numSubjects; i++) {
          const randomIndex = Math.floor(Math.random() * subjects.length);
          const randomSubject = subjects[randomIndex];
          
          if (!randomSubjects.some(s => s.toString() === randomSubject._id.toString())) {
            randomSubjects.push(randomSubject._id);
          }
        }
        
        teacher.subjects = randomSubjects;
        await teacher.save();
        console.log(`Assigned ${randomSubjects.length} subjects to teacher`);
      } else {
        console.log(`Teacher has ${teacher.subjects.length} subjects assigned`);
      }
      
      // Check if teacher is assigned to any classes
      let isAssignedToClass = false;
      for (const cls of classes) {
        if (!cls.subjects) continue;
        
        for (const subjectAssignment of cls.subjects) {
          if (subjectAssignment.teacher && 
              subjectAssignment.teacher.toString() === teacher._id.toString()) {
            isAssignedToClass = true;
            break;
          }
        }
        
        if (isAssignedToClass) break;
      }
      
      if (!isAssignedToClass) {
        console.log('Teacher is not assigned to any class, assigning to classes...');
        
        // For each subject the teacher can teach, assign them to a class
        for (const subjectId of teacher.subjects) {
          // Find a class that doesn't have a teacher for this subject
          let assigned = false;
          
          for (const cls of classes) {
            if (!cls.subjects) {
              cls.subjects = [];
            }
            
            // Check if this subject is already in the class
            let subjectExists = false;
            let subjectIndex = -1;
            
            for (let i = 0; i < cls.subjects.length; i++) {
              if (cls.subjects[i].subject && 
                  cls.subjects[i].subject.toString() === subjectId.toString()) {
                subjectExists = true;
                subjectIndex = i;
                break;
              }
            }
            
            if (subjectExists) {
              // If subject exists but has no teacher, assign this teacher
              if (!cls.subjects[subjectIndex].teacher) {
                cls.subjects[subjectIndex].teacher = teacher._id;
                await cls.save();
                console.log(`Assigned teacher to existing subject in class ${cls.name}`);
                assigned = true;
                break;
              }
            } else {
              // If subject doesn't exist in this class, add it with this teacher
              cls.subjects.push({
                subject: subjectId,
                teacher: teacher._id
              });
              
              await cls.save();
              console.log(`Added new subject to class ${cls.name} with teacher`);
              assigned = true;
              break;
            }
          }
          
          if (assigned) break; // Only assign one subject per teacher for now
        }
      } else {
        console.log('Teacher is already assigned to at least one class');
      }
    }
    
    console.log('\nAll teachers have been processed successfully!');
    
    // Verify teacher assignments
    console.log('\nVerifying teacher assignments...');
    const updatedClasses = await Class.find()
      .populate('subjects.subject')
      .populate('subjects.teacher');
    
    let totalAssignments = 0;
    
    for (const cls of updatedClasses) {
      console.log(`\nClass: ${cls.name}`);
      
      if (!cls.subjects || cls.subjects.length === 0) {
        console.log('  No subjects assigned to this class');
        continue;
      }
      
      for (const subjectAssignment of cls.subjects) {
        if (!subjectAssignment.subject) {
          console.log('  Invalid subject assignment (no subject)');
          continue;
        }
        
        const subjectName = subjectAssignment.subject.name;
        const teacherName = subjectAssignment.teacher ? 
          `${subjectAssignment.teacher.firstName} ${subjectAssignment.teacher.lastName}` : 
          'No teacher assigned';
        
        console.log(`  Subject: ${subjectName}, Teacher: ${teacherName}`);
        
        if (subjectAssignment.teacher) {
          totalAssignments++;
        }
      }
    }
    
    console.log(`\nTotal teacher-subject-class assignments: ${totalAssignments}`);
    console.log('\nMarks entry issue fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing marks entry issue:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixMarksEntryIssue();
