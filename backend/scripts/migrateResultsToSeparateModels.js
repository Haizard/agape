const mongoose = require('mongoose');
const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');

/**
 * Script to migrate existing results to the new O-LEVEL and A-LEVEL result models
 */
async function migrateResults() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all existing results
    console.log('Fetching existing results...');
    const results = await Result.find({});
    console.log(`Found ${results.length} results to migrate`);

    // Initialize counters
    let oLevelCount = 0;
    let aLevelCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each result
    for (const result of results) {
      try {
        // Get the student to determine education level
        const student = await Student.findById(result.studentId);

        if (!student) {
          console.log(`Skipping result ${result._id}: Student not found`);
          skippedCount++;
          continue;
        }

        // Get education level
        const educationLevel = student.educationLevel || 'O_LEVEL';

        // Create data object for new result
        const resultData = {
          studentId: result.studentId,
          examId: result.examId,
          academicYearId: result.academicYearId,
          examTypeId: result.examTypeId,
          subjectId: result.subjectId,
          classId: result.classId,
          marksObtained: result.marksObtained,
          grade: result.grade,
          points: result.points,
          comment: result.comment,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        };

        // Create new result based on education level
        if (educationLevel === 'A_LEVEL') {
          // Check if result already exists
          const existingResult = await ALevelResult.findOne({
            studentId: result.studentId,
            examId: result.examId,
            subjectId: result.subjectId
          });

          if (!existingResult) {
            const aLevelResult = new ALevelResult(resultData);
            await aLevelResult.save();
            aLevelCount++;
          } else {
            console.log(`Skipping A-LEVEL result ${result._id}: Already exists`);
            skippedCount++;
          }
        } else {
          // Check if result already exists
          const existingResult = await OLevelResult.findOne({
            studentId: result.studentId,
            examId: result.examId,
            subjectId: result.subjectId
          });

          if (!existingResult) {
            const oLevelResult = new OLevelResult(resultData);
            await oLevelResult.save();
            oLevelCount++;
          } else {
            console.log(`Skipping O-LEVEL result ${result._id}: Already exists`);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`Error migrating result ${result._id}:`, error);
        errorCount++;
      }
    }

    // Print summary
    console.log('\nMigration Summary:');
    console.log(`Total results processed: ${results.length}`);
    console.log(`O-LEVEL results migrated: ${oLevelCount}`);
    console.log(`A-LEVEL results migrated: ${aLevelCount}`);
    console.log(`Skipped results: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateResults();
