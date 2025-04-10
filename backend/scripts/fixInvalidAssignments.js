const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const TeacherAssignment = require('../models/TeacherAssignment');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function fixInvalidAssignments() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all assignments
    console.log('Finding all assignments...');
    const assignments = await TeacherAssignment.find();
    console.log(`Found ${assignments.length} assignments`);

    // Find all teachers, subjects, classes, and academic years
    const [teachers, subjects, classes, academicYears] = await Promise.all([
      Teacher.find(),
      Subject.find(),
      Class.find(),
      AcademicYear.find()
    ]);

    console.log(`Found ${teachers.length} teachers`);
    console.log(`Found ${subjects.length} subjects`);
    console.log(`Found ${classes.length} classes`);
    console.log(`Found ${academicYears.length} academic years`);

    // Get the default academic year (active or most recent)
    const defaultAcademicYear = academicYears.find(year => year.isActive) || 
                               academicYears.sort((a, b) => b.year - a.year)[0];
    
    if (!defaultAcademicYear) {
      console.error('No academic year found. Cannot fix assignments.');
      return;
    }

    console.log(`Using default academic year: ${defaultAcademicYear.name}`);

    // Process each assignment
    let fixedCount = 0;
    let deletedCount = 0;

    for (const assignment of assignments) {
      console.log(`\nProcessing assignment: ${assignment._id}`);
      
      let needsUpdate = false;
      let shouldDelete = false;

      // Check teacher
      if (!assignment.teacher) {
        console.log('Assignment has no teacher');
        shouldDelete = true;
      } else {
        const teacherExists = teachers.some(t => t._id.toString() === assignment.teacher.toString());
        if (!teacherExists) {
          console.log(`Teacher ${assignment.teacher} does not exist`);
          shouldDelete = true;
        }
      }

      // Check subject
      if (!assignment.subject) {
        console.log('Assignment has no subject');
        shouldDelete = true;
      } else {
        const subjectExists = subjects.some(s => s._id.toString() === assignment.subject.toString());
        if (!subjectExists) {
          console.log(`Subject ${assignment.subject} does not exist`);
          shouldDelete = true;
        }
      }

      // Check class
      if (!assignment.class) {
        console.log('Assignment has no class');
        shouldDelete = true;
      } else {
        const classExists = classes.some(c => c._id.toString() === assignment.class.toString());
        if (!classExists) {
          console.log(`Class ${assignment.class} does not exist`);
          shouldDelete = true;
        }
      }

      // Check academic year
      if (!assignment.academicYear) {
        console.log('Assignment has no academic year, setting default');
        assignment.academicYear = defaultAcademicYear._id;
        needsUpdate = true;
      } else {
        const yearExists = academicYears.some(y => y._id.toString() === assignment.academicYear.toString());
        if (!yearExists) {
          console.log(`Academic year ${assignment.academicYear} does not exist, setting default`);
          assignment.academicYear = defaultAcademicYear._id;
          needsUpdate = true;
        }
      }

      // Check dates
      if (!assignment.startDate) {
        console.log('Assignment has no start date, setting default');
        assignment.startDate = new Date();
        needsUpdate = true;
      }

      if (!assignment.endDate) {
        console.log('Assignment has no end date, setting default');
        assignment.endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        needsUpdate = true;
      }

      // Update or delete the assignment
      if (shouldDelete) {
        console.log(`Deleting invalid assignment: ${assignment._id}`);
        await TeacherAssignment.deleteOne({ _id: assignment._id });
        deletedCount++;
      } else if (needsUpdate) {
        console.log(`Updating assignment: ${assignment._id}`);
        await assignment.save();
        fixedCount++;
      } else {
        console.log(`Assignment ${assignment._id} is valid, no changes needed`);
      }
    }

    console.log(`\nFixed ${fixedCount} assignments`);
    console.log(`Deleted ${deletedCount} invalid assignments`);
    console.log('Assignment fixing complete!');

  } catch (error) {
    console.error('Error fixing invalid assignments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixInvalidAssignments();
