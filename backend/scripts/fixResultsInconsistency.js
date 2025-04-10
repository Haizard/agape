const mongoose = require('mongoose');
const Student = require('../models/Student');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');
const fs = require('fs');
const path = require('path');

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `fix_results_${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

    log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Fix duplicate results in the new models
async function fixDuplicateResults() {
  log('Fixing duplicate results...');

  // Fix O-LEVEL duplicates
  const oLevelDuplicates = await findDuplicateResults(OLevelResult);
  log(`Found ${oLevelDuplicates.length} duplicate sets in O-LEVEL results`);

  for (const duplicate of oLevelDuplicates) {
    // Keep only the most recent result
    const resultIds = duplicate.results.map(r => r.id);
    resultIds.shift(); // Remove the first one (we'll keep it)

    log(`Removing ${resultIds.length} duplicate O-LEVEL results for Student=${duplicate._id.studentId}, Exam=${duplicate._id.examId}, Subject=${duplicate._id.subjectId}`);

    // Delete the duplicates
    await OLevelResult.deleteMany({ _id: { $in: resultIds } });
  }

  // Fix A-LEVEL duplicates
  const aLevelDuplicates = await findDuplicateResults(ALevelResult);
  log(`Found ${aLevelDuplicates.length} duplicate sets in A-LEVEL results`);

  for (const duplicate of aLevelDuplicates) {
    // Keep only the most recent result
    const resultIds = duplicate.results.map(r => r.id);
    resultIds.shift(); // Remove the first one (we'll keep it)

    log(`Removing ${resultIds.length} duplicate A-LEVEL results for Student=${duplicate._id.studentId}, Exam=${duplicate._id.examId}, Subject=${duplicate._id.subjectId}`);

    // Delete the duplicates
    await ALevelResult.deleteMany({ _id: { $in: resultIds } });
  }

  log('Duplicate results fixed');
}

// Find duplicate results in a model
async function findDuplicateResults(Model) {
  // Find results with the same student, exam, and subject
  const duplicates = await Model.aggregate([
    {
      $group: {
        _id: {
          studentId: '$studentId',
          examId: '$examId',
          subjectId: '$subjectId'
        },
        count: { $sum: 1 },
        results: { $push: { id: '$_id', marks: '$marksObtained', createdAt: '$createdAt' } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    },
    {
      $sort: {
        '_id.studentId': 1,
        '_id.examId': 1,
        '_id.subjectId': 1
      }
    }
  ]);

  // Sort results by creation date (newest first)
  for (const duplicate of duplicates) {
    duplicate.results.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt - a.createdAt;
      }
      return 0;
    });
  }

  return duplicates;
}

// Fix incorrect grades and points
async function fixIncorrectGrades() {
  log('Fixing incorrect grades and points...');

  // Fix O-LEVEL grades
  const oLevelResults = await OLevelResult.find();
  log(`Checking ${oLevelResults.length} O-LEVEL results`);

  let oLevelFixed = 0;

  for (const result of oLevelResults) {
    const marks = result.marksObtained;
    let expectedGrade, expectedPoints;

    // Calculate expected grade and points for O-LEVEL
    if (marks >= 75) { expectedGrade = 'A'; expectedPoints = 1; }
    else if (marks >= 65) { expectedGrade = 'B'; expectedPoints = 2; }
    else if (marks >= 50) { expectedGrade = 'C'; expectedPoints = 3; }
    else if (marks >= 30) { expectedGrade = 'D'; expectedPoints = 4; }
    else { expectedGrade = 'F'; expectedPoints = 5; }

    // Check if grade or points are incorrect
    if (result.grade !== expectedGrade || result.points !== expectedPoints) {
      log(`Fixing O-LEVEL result ${result._id}: Marks=${marks}, Grade=${result.grade}->${expectedGrade}, Points=${result.points}->${expectedPoints}`);

      // Update the result
      await OLevelResult.updateOne(
        { _id: result._id },
        { $set: { grade: expectedGrade, points: expectedPoints } }
      );

      oLevelFixed++;
    }
  }

  // Fix A-LEVEL grades
  const aLevelResults = await ALevelResult.find();
  log(`Checking ${aLevelResults.length} A-LEVEL results`);

  let aLevelFixed = 0;

  for (const result of aLevelResults) {
    const marks = result.marksObtained;
    let expectedGrade, expectedPoints;

    // Calculate expected grade and points for A-LEVEL
    if (marks >= 80) { expectedGrade = 'A'; expectedPoints = 1; }
    else if (marks >= 70) { expectedGrade = 'B'; expectedPoints = 2; }
    else if (marks >= 60) { expectedGrade = 'C'; expectedPoints = 3; }
    else if (marks >= 50) { expectedGrade = 'D'; expectedPoints = 4; }
    else if (marks >= 40) { expectedGrade = 'E'; expectedPoints = 5; }
    else if (marks >= 35) { expectedGrade = 'S'; expectedPoints = 6; }
    else { expectedGrade = 'F'; expectedPoints = 7; }

    // Check if grade or points are incorrect
    if (result.grade !== expectedGrade || result.points !== expectedPoints) {
      log(`Fixing A-LEVEL result ${result._id}: Marks=${marks}, Grade=${result.grade}->${expectedGrade}, Points=${result.points}->${expectedPoints}`);

      // Update the result
      await ALevelResult.updateOne(
        { _id: result._id },
        { $set: { grade: expectedGrade, points: expectedPoints } }
      );

      aLevelFixed++;
    }
  }

  log(`Fixed ${oLevelFixed} O-LEVEL results and ${aLevelFixed} A-LEVEL results`);
}

// Migrate results from old model to new models
async function migrateOldResults() {
  log('Migrating results from old model to new models...');

  // Get all students
  const students = await Student.find();
  log(`Found ${students.length} students`);

  let migratedCount = 0;

  for (const student of students) {
    const educationLevel = student.educationLevel || 'O_LEVEL';
    const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;

    // Get results from old model for this student
    const oldResults = await Result.find({
      $or: [
        { studentId: student._id },
        { student: student._id }
      ]
    });

    if (oldResults.length === 0) {
      continue;
    }

    log(`Found ${oldResults.length} old results for student ${student._id} (${student.firstName} ${student.lastName})`);

    for (const oldResult of oldResults) {
      // Get the correct IDs (handle both naming conventions)
      const studentId = oldResult.studentId || oldResult.student;
      const examId = oldResult.examId || oldResult.exam;
      const subjectId = oldResult.subjectId || oldResult.subject;
      const academicYearId = oldResult.academicYearId || oldResult.academicYear;
      const examTypeId = oldResult.examTypeId || oldResult.examType;
      const classId = oldResult.classId || oldResult.class;

      if (!studentId || !examId || !subjectId) {
        log(`Skipping result with missing required fields: ${oldResult._id}`);
        continue;
      }

      // Check if result already exists in new model
      const existingResult = await ResultModel.findOne({
        studentId,
        examId,
        subjectId
      });

      if (!existingResult) {
        try {
          // Create new result in the appropriate model
          const newResult = new ResultModel({
            studentId,
            examId,
            academicYearId,
            examTypeId,
            subjectId,
            classId: classId || student.class, // Use student's class if not specified
            marksObtained: oldResult.marksObtained,
            grade: oldResult.grade,
            points: oldResult.points,
            comment: oldResult.comment,
            createdAt: oldResult.createdAt,
            updatedAt: oldResult.updatedAt
          });

          await newResult.save();
          migratedCount++;

          log(`Migrated result for student ${student._id}, subject ${subjectId}, exam ${examId}`);
        } catch (error) {
          log(`Error migrating result: ${error.message}`);
        }
      }
    }
  }

  log(`Migrated ${migratedCount} results from old model to new models`);
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    log('Starting results inconsistency fix');

    // Fix duplicate results
    await fixDuplicateResults();

    // Fix incorrect grades and points
    await fixIncorrectGrades();

    // Migrate results from old model to new models
    await migrateOldResults();

    log('Results inconsistency fix completed');

    // Close log stream
    logStream.end();

    // Disconnect from MongoDB
    await mongoose.disconnect();
    log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Fix failed:', error);

    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }

    process.exit(1);
  }
}

// Run the main function
main();
