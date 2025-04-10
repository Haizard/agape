const mongoose = require('mongoose');
const Student = require('../models/Student');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const MigrationStatus = require('../models/MigrationStatus');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `complete_migration_${new Date().toISOString().split('T')[0]}.log`);
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
    log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Create or update migration status
async function updateMigrationStatus(name, status, updates = {}) {
  try {
    const migrationStatus = await MigrationStatus.findOneAndUpdate(
      { name },
      { 
        status,
        lastUpdated: new Date(),
        ...updates
      },
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return migrationStatus;
  } catch (error) {
    log(`Error updating migration status: ${error.message}`);
    throw error;
  }
}

// Record error in migration status
async function recordMigrationError(name, message, recordId) {
  try {
    await MigrationStatus.findOneAndUpdate(
      { name },
      { 
        $push: { 
          errors: { 
            message, 
            recordId,
            timestamp: new Date()
          } 
        },
        $inc: { errorRecords: 1 },
        lastUpdated: new Date()
      }
    );
  } catch (error) {
    log(`Error recording migration error: ${error.message}`);
  }
}

// Calculate grade and points based on education level and marks
function calculateGradeAndPoints(marks, educationLevel) {
  if (educationLevel === 'A_LEVEL') {
    // A-LEVEL grading
    if (marks >= 80) return { grade: 'A', points: 1 };
    else if (marks >= 70) return { grade: 'B', points: 2 };
    else if (marks >= 60) return { grade: 'C', points: 3 };
    else if (marks >= 50) return { grade: 'D', points: 4 };
    else if (marks >= 40) return { grade: 'E', points: 5 };
    else if (marks >= 35) return { grade: 'S', points: 6 };
    else return { grade: 'F', points: 7 };
  } else {
    // O-LEVEL grading
    if (marks >= 75) return { grade: 'A', points: 1 };
    else if (marks >= 65) return { grade: 'B', points: 2 };
    else if (marks >= 50) return { grade: 'C', points: 3 };
    else if (marks >= 30) return { grade: 'D', points: 4 };
    else return { grade: 'F', points: 5 };
  }
}

// Migrate results from old model to new models
async function migrateResults() {
  const migrationName = 'results_migration';
  
  try {
    // Get all results from the old model
    const oldResults = await Result.find();
    
    // Create or update migration status
    await updateMigrationStatus(migrationName, 'in_progress', {
      startTime: new Date(),
      totalRecords: oldResults.length,
      processedRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0
    });
    
    log(`Found ${oldResults.length} results in the old model`);
    
    let oLevelMigrated = 0;
    let aLevelMigrated = 0;
    let skipped = 0;
    let processed = 0;
    
    for (const oldResult of oldResults) {
      processed++;
      
      try {
        // Skip if missing required fields
        if (!oldResult.studentId && !oldResult.student) {
          log(`Skipping result ${oldResult._id} due to missing student ID`);
          skipped++;
          await updateMigrationStatus(migrationName, 'in_progress', {
            processedRecords: processed,
            skippedRecords: skipped
          });
          await recordMigrationError(migrationName, 'Missing student ID', oldResult._id);
          continue;
        }
        
        if (!oldResult.examId && !oldResult.exam) {
          log(`Skipping result ${oldResult._id} due to missing exam ID`);
          skipped++;
          await updateMigrationStatus(migrationName, 'in_progress', {
            processedRecords: processed,
            skippedRecords: skipped
          });
          await recordMigrationError(migrationName, 'Missing exam ID', oldResult._id);
          continue;
        }
        
        if (!oldResult.subjectId && !oldResult.subject) {
          log(`Skipping result ${oldResult._id} due to missing subject ID`);
          skipped++;
          await updateMigrationStatus(migrationName, 'in_progress', {
            processedRecords: processed,
            skippedRecords: skipped
          });
          await recordMigrationError(migrationName, 'Missing subject ID', oldResult._id);
          continue;
        }
        
        // Get the correct IDs (handle both naming conventions)
        const studentId = oldResult.studentId || oldResult.student;
        const examId = oldResult.examId || oldResult.exam;
        const subjectId = oldResult.subjectId || oldResult.subject;
        const academicYearId = oldResult.academicYearId || oldResult.academicYear;
        const examTypeId = oldResult.examTypeId || oldResult.examType;
        const classId = oldResult.classId || oldResult.class;
        
        // Get student to determine education level
        const student = await Student.findById(studentId);
        if (!student) {
          log(`Skipping result ${oldResult._id} due to student not found (ID: ${studentId})`);
          skipped++;
          await updateMigrationStatus(migrationName, 'in_progress', {
            processedRecords: processed,
            skippedRecords: skipped
          });
          await recordMigrationError(migrationName, `Student not found (ID: ${studentId})`, oldResult._id);
          continue;
        }
        
        // Determine education level
        const educationLevel = student.educationLevel || 'O_LEVEL';
        log(`Processing result for student ${student.firstName} ${student.lastName} with education level ${educationLevel}`);
        
        // Get the appropriate model
        const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
        
        // Check if result already exists in new model
        const existingResult = await ResultModel.findOne({
          studentId,
          examId,
          subjectId
        });
        
        if (existingResult) {
          log(`Result already exists in ${educationLevel} model for student ${student.firstName} ${student.lastName}, subject ${subjectId}, exam ${examId}`);
          skipped++;
          await updateMigrationStatus(migrationName, 'in_progress', {
            processedRecords: processed,
            skippedRecords: skipped
          });
          continue;
        }
        
        // Calculate grade and points based on education level
        const marks = oldResult.marksObtained;
        const { grade, points } = calculateGradeAndPoints(marks, educationLevel);
        
        // Create new result in the appropriate model
        const newResult = new ResultModel({
          studentId,
          examId,
          academicYearId,
          examTypeId,
          subjectId,
          classId: classId || student.class, // Use student's class if not specified
          marksObtained: marks,
          grade,
          points,
          comment: oldResult.comment,
          createdAt: oldResult.createdAt,
          updatedAt: oldResult.updatedAt
        });
        
        // Save the new result
        await newResult.save();
        
        log(`Migrated result for student ${student.firstName} ${student.lastName}, subject ${subjectId}, exam ${examId} to ${educationLevel} model`);
        
        if (educationLevel === 'A_LEVEL') {
          aLevelMigrated++;
        } else {
          oLevelMigrated++;
        }
        
        await updateMigrationStatus(migrationName, 'in_progress', {
          processedRecords: processed,
          migratedRecords: oLevelMigrated + aLevelMigrated
        });
        
      } catch (error) {
        log(`Error processing result ${oldResult._id}: ${error.message}`);
        await recordMigrationError(migrationName, error.message, oldResult._id);
        await updateMigrationStatus(migrationName, 'in_progress', {
          processedRecords: processed,
          errorRecords: (await MigrationStatus.findOne({ name: migrationName })).errorRecords + 1
        });
      }
      
      // Update progress every 10 records
      if (processed % 10 === 0) {
        log(`Processed ${processed}/${oldResults.length} results (${Math.round(processed / oldResults.length * 100)}%)`);
      }
    }
    
    // Update final migration status
    await updateMigrationStatus(migrationName, 'completed', {
      endTime: new Date(),
      processedRecords: processed,
      migratedRecords: oLevelMigrated + aLevelMigrated,
      skippedRecords: skipped
    });
    
    log(`Migration completed:
- Processed ${processed}/${oldResults.length} results
- Migrated ${oLevelMigrated} results to O-LEVEL model
- Migrated ${aLevelMigrated} results to A-LEVEL model
- Skipped ${skipped} results
`);
    
    return { oLevelMigrated, aLevelMigrated, skipped, processed };
  } catch (error) {
    log(`Migration failed: ${error.message}`);
    await updateMigrationStatus(migrationName, 'failed', {
      endTime: new Date()
    });
    throw error;
  }
}

// Verify migration results
async function verifyMigration() {
  log('Verifying migration results...');
  
  try {
    // Count results in each model
    const oldResultsCount = await Result.countDocuments();
    const oLevelResultsCount = await OLevelResult.countDocuments();
    const aLevelResultsCount = await ALevelResult.countDocuments();
    
    log(`Results count:
- Old model: ${oldResultsCount}
- O-LEVEL model: ${oLevelResultsCount}
- A-LEVEL model: ${aLevelResultsCount}
- Total new models: ${oLevelResultsCount + aLevelResultsCount}
`);
    
    // Check for missing results
    const missingResults = oldResultsCount - (oLevelResultsCount + aLevelResultsCount);
    if (missingResults > 0) {
      log(`Warning: ${missingResults} results may not have been migrated`);
    } else {
      log('All results have been migrated successfully');
    }
    
    // Check for duplicate results in new models
    const oLevelDuplicates = await OLevelResult.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            examId: '$examId',
            subjectId: '$subjectId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    const aLevelDuplicates = await ALevelResult.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            examId: '$examId',
            subjectId: '$subjectId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    log(`Duplicate results:
- O-LEVEL model: ${oLevelDuplicates.length} sets of duplicates
- A-LEVEL model: ${aLevelDuplicates.length} sets of duplicates
`);
    
    return {
      oldResultsCount,
      oLevelResultsCount,
      aLevelResultsCount,
      missingResults,
      oLevelDuplicates: oLevelDuplicates.length,
      aLevelDuplicates: aLevelDuplicates.length
    };
  } catch (error) {
    log(`Verification failed: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    log('Starting complete migration process...');
    
    // Migrate results
    await migrateResults();
    
    // Verify migration
    await verifyMigration();
    
    log('Migration process completed');
    
    // Close log stream
    logStream.end();
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Migration failed:', error);
    
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
