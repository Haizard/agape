/**
 * Script to check the current state of the database
 * This script will:
 * 1. Count the number of documents in each collection
 * 2. Log the details for review
 */
const mongoose = require('mongoose');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function checkDatabaseState() {
  try {
    console.log('Starting database state check...');
    
    // Count documents in each collection
    const resultCount = await Result.countDocuments({});
    const assessmentCount = await Assessment.countDocuments({});
    const studentCount = await Student.countDocuments({});
    const subjectCount = await Subject.countDocuments({});
    const classCount = await Class.countDocuments({});
    const academicYearCount = await AcademicYear.countDocuments({});
    
    console.log(`Results: ${resultCount}`);
    console.log(`Assessments: ${assessmentCount}`);
    console.log(`Students: ${studentCount}`);
    console.log(`Subjects: ${subjectCount}`);
    console.log(`Classes: ${classCount}`);
    console.log(`Academic Years: ${academicYearCount}`);
    
    // Check if there are any assessments
    if (assessmentCount > 0) {
      console.log('\nSample assessments:');
      const assessments = await Assessment.find({}).limit(5);
      assessments.forEach(a => {
        console.log(`  ${a._id}: ${a.name}, term=${a.term}, isUniversal=${a.isUniversal}, isVisible=${a.isVisible}, status=${a.status}`);
      });
    }
    
    // Check if there are any results
    if (resultCount > 0) {
      console.log('\nSample results:');
      const results = await Result.find({}).limit(5);
      results.forEach(r => {
        console.log(`  ${r._id}: student=${r.studentId}, subject=${r.subjectId}, assessment=${r.assessmentId}, marks=${r.marksObtained}`);
      });
    }
    
    console.log('\nDatabase state check completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during database state check:', error);
    process.exit(1);
  }
}

// Run the check
checkDatabaseState();
