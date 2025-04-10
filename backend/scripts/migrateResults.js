const mongoose = require('mongoose');
const Student = require('../models/Student');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');
const Subject = require('../models/Subject');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Function to migrate results from old model to new models
async function migrateResults() {
  console.log('Migrating results from old model to new models...');

  try {
    // Get all results from the old model
    const oldResults = await Result.find().populate('studentId', 'educationLevel firstName lastName');
    console.log(`Found ${oldResults.length} results in the old model`);

    let oLevelMigrated = 0;
    let aLevelMigrated = 0;
    let skipped = 0;

    for (const oldResult of oldResults) {
      // Skip if missing required fields
      if (!oldResult.studentId || !oldResult.examId || !oldResult.subjectId) {
        console.log(`Skipping result ${oldResult._id} due to missing required fields`);
        skipped++;
        continue;
      }

      // Get student to determine education level
      const student = oldResult.studentId;
      if (!student) {
        console.log(`Skipping result ${oldResult._id} due to missing student`);
        skipped++;
        continue;
      }

      // Determine education level
      const educationLevel = student.educationLevel || 'O_LEVEL';
      console.log(`Processing result for student ${student.firstName} ${student.lastName} with education level ${educationLevel}`);

      // Get the appropriate model
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

      // Check if result already exists in new model
      const existingResult = await ResultModel.findOne({
        studentId: oldResult.studentId._id,
        examId: oldResult.examId,
        subjectId: oldResult.subjectId
      });

      if (existingResult) {
        console.log(`Result already exists in ${educationLevel} model for student ${oldResult.studentId._id}, subject ${oldResult.subjectId}, exam ${oldResult.examId}`);
        skipped++;
        continue;
      }

      // Get subject to check if it's a principal subject (for A-LEVEL)
      let isPrincipal = false;
      if (educationLevel === 'A_LEVEL') {
        const subject = await Subject.findById(oldResult.subjectId);
        isPrincipal = subject ? subject.isPrincipal : false;
      }

      // Calculate grade and points based on education level
      let grade, points;
      const marks = oldResult.marksObtained;

      if (educationLevel === 'O_LEVEL') {
        // O-LEVEL grading
        if (marks >= 75) { grade = 'A'; points = 1; }
        else if (marks >= 65) { grade = 'B'; points = 2; }
        else if (marks >= 50) { grade = 'C'; points = 3; }
        else if (marks >= 30) { grade = 'D'; points = 4; }
        else { grade = 'F'; points = 5; }
      } else {
        // A-LEVEL grading
        if (marks >= 80) { grade = 'A'; points = 1; }
        else if (marks >= 70) { grade = 'B'; points = 2; }
        else if (marks >= 60) { grade = 'C'; points = 3; }
        else if (marks >= 50) { grade = 'D'; points = 4; }
        else if (marks >= 40) { grade = 'E'; points = 5; }
        else if (marks >= 35) { grade = 'S'; points = 6; }
        else { grade = 'F'; points = 7; }
      }

      // Create new result in the appropriate model
      const newResult = new ResultModel({
        studentId: oldResult.studentId._id,
        examId: oldResult.examId,
        academicYearId: oldResult.academicYearId,
        examTypeId: oldResult.examTypeId,
        subjectId: oldResult.subjectId,
        classId: oldResult.classId || student.class, // Use student's class if not specified
        marksObtained: oldResult.marksObtained,
        grade: grade,
        points: points,
        comment: oldResult.comment,
        createdAt: oldResult.createdAt,
        updatedAt: oldResult.updatedAt
      });

      try {
        // Save the new result
        await newResult.save();

        console.log(`Migrated result for student ${student.firstName} ${student.lastName}, subject ${oldResult.subjectId}, exam ${oldResult.examId} to ${educationLevel} model`);

        if (educationLevel === 'O_LEVEL') {
          oLevelMigrated++;
        } else {
          aLevelMigrated++;
        }
      } catch (error) {
        console.error(`Error saving result: ${error.message}`);
        skipped++;
      }
    }

    console.log(`Migration completed:
- Migrated ${oLevelMigrated} results to O-LEVEL model
- Migrated ${aLevelMigrated} results to A-LEVEL model
- Skipped ${skipped} results
`);

    return { oLevelMigrated, aLevelMigrated, skipped };
  } catch (error) {
    console.error('Error migrating results:', error);
    return { oLevelMigrated: 0, aLevelMigrated: 0, skipped: 0 };
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Migrate results
    await migrateResults();

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Migration failed:', error);

    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }

    process.exit(1);
  }
}

// Run the main function
main();
