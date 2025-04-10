const mongoose = require('mongoose');
const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const fs = require('fs');
const path = require('path');

/**
 * Complete migration script to fully migrate all results to the new models
 * and phase out the old model
 */
async function completeMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB');

    // Create a log file
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const logFile = path.join(logDir, `migration_${new Date().toISOString().replace(/:/g, '-')}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    const log = (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(logMessage);
      logStream.write(logMessage + '\n');
    };

    log('Starting complete migration process');
    
    // Step 1: Count all results in the old model
    const totalResults = await Result.countDocuments();
    log(`Found ${totalResults} results in the old model to migrate`);
    
    // Step 2: Get all students to determine education level
    const students = await Student.find();
    log(`Found ${students.length} students`);
    
    // Create a map of student IDs to education levels for quick lookup
    const studentEducationLevels = new Map();
    for (const student of students) {
      studentEducationLevels.set(student._id.toString(), student.educationLevel || 'O_LEVEL');
    }
    
    // Step 3: Process results in batches to avoid memory issues
    const batchSize = 100;
    let processedCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    log(`Processing results in batches of ${batchSize}`);
    
    for (let skip = 0; skip < totalResults; skip += batchSize) {
      const batch = await Result.find()
        .skip(skip)
        .limit(batchSize)
        .populate('studentId', 'firstName lastName educationLevel')
        .populate('subjectId', 'name code isPrincipal');
      
      log(`Processing batch ${Math.floor(skip / batchSize) + 1} (${batch.length} results)`);
      
      for (const result of batch) {
        processedCount++;
        
        try {
          // Get student ID
          const studentId = result.studentId?._id || result.student;
          if (!studentId) {
            log(`Skipping result ${result._id}: No student ID found`);
            skippedCount++;
            continue;
          }
          
          // Get education level
          let educationLevel;
          if (result.studentId && result.studentId.educationLevel) {
            educationLevel = result.studentId.educationLevel;
          } else {
            educationLevel = studentEducationLevels.get(studentId.toString()) || 'O_LEVEL';
          }
          
          // Select the appropriate model
          const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
          
          // Check if result already exists in the new model
          const existingResult = await ResultModel.findOne({
            studentId: studentId,
            examId: result.examId || result.exam,
            subjectId: result.subjectId?._id || result.subject || result.subjectId
          });
          
          if (existingResult) {
            // Update existing result if needed
            let needsUpdate = false;
            
            // Check if marks are different
            if (existingResult.marksObtained !== result.marksObtained) {
              log(`Updating marks for result ${existingResult._id}: ${existingResult.marksObtained} -> ${result.marksObtained}`);
              existingResult.marksObtained = result.marksObtained;
              needsUpdate = true;
            }
            
            // Check if grade is different
            if (existingResult.grade !== result.grade) {
              log(`Updating grade for result ${existingResult._id}: ${existingResult.grade} -> ${result.grade}`);
              existingResult.grade = result.grade;
              needsUpdate = true;
            }
            
            // Check if points are different
            if (existingResult.points !== result.points) {
              log(`Updating points for result ${existingResult._id}: ${existingResult.points} -> ${result.points}`);
              existingResult.points = result.points;
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              await existingResult.save();
              log(`Updated existing result ${existingResult._id}`);
              migratedCount++;
            } else {
              log(`Skipping result ${result._id}: Already exists with same data`);
              skippedCount++;
            }
          } else {
            // Create new result
            const newResult = new ResultModel({
              studentId: studentId,
              examId: result.examId || result.exam,
              academicYearId: result.academicYearId || result.academicYear,
              examTypeId: result.examTypeId || result.examType,
              subjectId: result.subjectId?._id || result.subject || result.subjectId,
              classId: result.classId || result.class,
              marksObtained: result.marksObtained,
              grade: result.grade,
              points: result.points,
              comment: result.comment,
              createdAt: result.createdAt,
              updatedAt: result.updatedAt
            });
            
            await newResult.save();
            log(`Created new result ${newResult._id} for student ${studentId}`);
            migratedCount++;
          }
        } catch (error) {
          log(`Error processing result ${result._id}: ${error.message}`);
          errorCount++;
        }
        
        // Log progress every 100 results
        if (processedCount % 100 === 0) {
          log(`Progress: ${processedCount}/${totalResults} (${Math.round(processedCount / totalResults * 100)}%)`);
        }
      }
    }
    
    // Step 4: Verify migration
    const oLevelCount = await OLevelResult.countDocuments();
    const aLevelCount = await ALevelResult.countDocuments();
    const totalNewResults = oLevelCount + aLevelCount;
    
    log('\nMigration Summary:');
    log(`Total results processed: ${processedCount}`);
    log(`Results migrated: ${migratedCount}`);
    log(`Results skipped: ${skippedCount}`);
    log(`Errors: ${errorCount}`);
    log(`O-LEVEL results: ${oLevelCount}`);
    log(`A-LEVEL results: ${aLevelCount}`);
    log(`Total results in new models: ${totalNewResults}`);
    
    // Step 5: Create a backup of the old model
    log('\nCreating backup of old results...');
    
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const backupFile = path.join(backupDir, `results_backup_${new Date().toISOString().replace(/:/g, '-')}.json`);
    
    // Export all results to a JSON file
    const allResults = await Result.find();
    fs.writeFileSync(backupFile, JSON.stringify(allResults, null, 2));
    
    log(`Backup created: ${backupFile}`);
    
    // Step 6: Update the Result model to be deprecated
    log('\nPhasing out old model...');
    
    // Create a deprecated flag file
    const deprecatedFlag = path.join(__dirname, '../models/RESULT_MODEL_DEPRECATED');
    fs.writeFileSync(deprecatedFlag, `This model was deprecated on ${new Date().toISOString()}`);
    
    log('Old model has been flagged as deprecated');
    
    // Step 7: Finalize
    log('\nMigration completed successfully');
    
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
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the migration
completeMigration();
